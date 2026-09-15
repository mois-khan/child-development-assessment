import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/server";

/**
 * Creates a school account with a password the admin sets, using Supabase's
 * admin "create user" API (not the email-based /auth/v1/invite Supabase
 * flow — that depends on the invite email actually arriving, which has been
 * unreliable). The account is created with email_confirm: true and the
 * given password already set, so the school can sign in at /join
 * immediately; no email has to be delivered for that to work.
 *
 * handle_new_user() (0017_close_signup_privilege_escalation.sql) no longer
 * reads account_type/school fields from user_metadata — that field is
 * exactly what a public signUp() call could also set, which used to let
 * anyone self-register as a school. This route now creates the
 * profiles(account_type='school') + schools rows itself, after deleting the
 * parent profile/lead the trigger creates by default for every new user.
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
        }),
      },
    );

    if (!response.ok) {
      const err = await response.json();
      return NextResponse.json({ error: err.msg || "Failed to create school account" }, { status: response.status });
    }

    const created = await response.json();
    const newUserId: string | undefined = created?.id;
    if (!newUserId) {
      return NextResponse.json({ error: "Account created but returned no user id" }, { status: 500 });
    }

    const admin = getSupabaseServiceRoleClient();

    // Overwrite the trigger's default parent profile with a school one, and
    // add the schools row — the two things user_metadata used to do.
    const { error: profileError } = await admin
      .from("profiles")
      .upsert(
        {
          id: newUserId,
          full_name: contactName ?? "",
          phone: contactPhone ?? "",
          email,
          account_type: "school",
        },
        { onConflict: "id" },
      );
    if (profileError) {
      return NextResponse.json(
        { error: `Account created, but setting up the school profile failed: ${profileError.message}` },
        { status: 500 },
      );
    }
    // Undoes handle_new_user()'s default lead row — a school is never a lead.
    await admin.from("leads").delete().eq("profile_id", newUserId);

    const { error: schoolError } = await admin.from("schools").upsert(
      {
        id: newUserId,
        school_name: schoolName,
        contact_name: contactName ?? "",
        contact_phone: contactPhone ?? "",
      },
      { onConflict: "id" },
    );
    if (schoolError) {
      return NextResponse.json(
        { error: `Account created, but the schools record failed: ${schoolError.message}` },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
