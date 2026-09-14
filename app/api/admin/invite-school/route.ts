import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Creates a school account with a password the admin sets, using Supabase's
 * admin "create user" API (not the email-based /auth/v1/invite Supabase
 * flow — that depends on the invite email actually arriving, which has been
 * unreliable). The account is created with email_confirm: true and the
 * given password already set, so the school can sign in at /join
 * immediately; no email has to be delivered for that to work. The same
 * metadata shape as before is passed through so handle_new_user()
 * (0007_schools.sql) still creates the right profiles/schools rows.
 *
 * Schools are never self-serve (see the migration's header note) — only an
 * admin with the "schools" page grant can call this. The UI already hides
 * /admin/schools from an admin without that grant; this check makes calling
 * the endpoint directly no more privileged than clicking through the page.
 */
export async function POST(request: Request) {
  try {
    const { email, password, schoolName, contactName, contactPhone } = await request.json();
    if (!email || !schoolName) {
      return NextResponse.json({ error: "email and schoolName required" }, { status: 400 });
    }
    if (!password || password.length < 8) {
      return NextResponse.json({ error: "password must be at least 8 characters" }, { status: 400 });
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

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY!,
          "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        },
        body: JSON.stringify({
          email,
          password,
          email_confirm: true,
          user_metadata: {
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
      return NextResponse.json({ error: err.msg || "Failed to create school account" }, { status: response.status });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
