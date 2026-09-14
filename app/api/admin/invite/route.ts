import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { ADMIN_ROLES } from "@/lib/types/rbac";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { email, role, pageAccess } = await request.json();
    if (!email || !role) {
      return NextResponse.json({ error: "email and role required" }, { status: 400 });
    }
    if (!ADMIN_ROLES.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    const pageIds: string[] = Array.isArray(pageAccess)
      ? pageAccess.filter((p) => typeof p === "string")
      : [];

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

    const { data: adminRow } = await supabase
      .from("admin_users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!adminRow || adminRow.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden: Only super_admin can invite users" }, { status: 403 });
    }

    // Where the invite email sends them to finish setting up their account —
    // without this Supabase falls back to the project's default Site URL,
    // which has no reason to know about this app's admin section at all.
    const redirectTo = `${new URL(request.url).origin}/admin/accept-invite`;

    // Call Supabase Admin API to invite user
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
            is_admin: "true", // metadata flag that triggers route them to admin_users
            role,
          },
        }),
      },
    );

    if (!response.ok) {
      const err = await response.json();
      return NextResponse.json({ error: err.msg || "Failed to invite user" }, { status: response.status });
    }

    // The invite call inserts the auth.users row synchronously, and a
    // trigger (0001_core.sql) creates the matching admin_users row in the
    // same transaction — so the invited user's admin_users row already
    // exists by the time this response comes back, and page grants chosen
    // at invite time can be written immediately instead of waiting for a
    // second "edit" step after the fact.
    const invited = await response.json();
    const newUserId: string | undefined = invited?.id;
    if (newUserId && role !== "super_admin" && pageIds.length > 0) {
      const admin = getSupabaseServiceRoleClient();
      const { error: grantError } = await admin
        .from("admin_page_access")
        .insert(pageIds.map((pageId) => ({ admin_user_id: newUserId, page_id: pageId })));
      if (grantError) {
        // The account exists and can sign in; only the initial page grants
        // failed to attach. Surface it as a warning, not a failure — the
        // invite itself worked, and a super_admin can still grant access
        // from the Edit drawer.
        return NextResponse.json({
          success: true,
          id: newUserId,
          warning: `Invite sent, but page access couldn't be set: ${grantError.message}. Set it from Edit.`,
        });
      }
    }

    return NextResponse.json({ success: true, id: newUserId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
