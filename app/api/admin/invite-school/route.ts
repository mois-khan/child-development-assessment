import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Invites a school account, the same way app/api/admin/invite invites
 * staff: Supabase's admin invite API, with metadata that
 * handle_new_user() (0007_schools.sql) reads to create the right rows.
 *
 * Schools are never self-serve (see the migration's header note) — only an
 * admin with the "schools" page grant can call this. The UI already hides
 * /admin/schools from an admin without that grant; this check makes calling
 * the endpoint directly no more privileged than clicking through the page.
 */
export async function POST(request: Request) {
  try {
    const { email, schoolName, contactName, contactPhone } = await request.json();
    if (!email || !schoolName) {
      return NextResponse.json({ error: "email and schoolName required" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {},
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: hasAccess } = await supabase.rpc("has_page_access", { page: "schools" });
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden: schools access required" }, { status: 403 });
    }

    // Same redirect target as staff invites and password resets — the
    // screen that exchanges the invite link's code for a session and lets
    // whoever it belongs to set a password.
    const redirectTo = `${new URL(request.url).origin}/admin/accept-invite`;

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/invite?redirect_to=${encodeURIComponent(redirectTo)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY!,
          "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        },
        body: JSON.stringify({
          email,
          data: {
            account_type: "school",
            school_name: schoolName,
            contact_name: contactName ?? "",
            contact_phone: contactPhone ?? "",
          },
        }),
      },
    );

    if (!response.ok) {
      const err = await response.json();
      return NextResponse.json({ error: err.msg || "Failed to invite school" }, { status: response.status });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
