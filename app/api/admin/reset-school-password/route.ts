import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Resets a school's password to one the admin picks, for the "resend
 * credentials" action — Supabase never stores the original plaintext
 * password, so there's nothing to literally resend; this sets a new one and
 * the caller shares that instead. Same auth shape as invite-school.
 */
export async function POST(request: Request) {
  try {
    const { schoolId, password } = await request.json();
    if (!schoolId || !password) {
      return NextResponse.json({ error: "schoolId and password required" }, { status: 400 });
    }
    if (password.length < 8) {
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
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users/${schoolId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY!,
          "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        },
        body: JSON.stringify({ password }),
      },
    );

    if (!response.ok) {
      const err = await response.json();
      return NextResponse.json({ error: err.msg || "Failed to reset password" }, { status: response.status });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
