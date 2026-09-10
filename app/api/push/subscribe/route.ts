import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Stores a browser's push subscription for the signed-in user.
 *
 * Runs as the caller, not the service role — push_subscriptions' RLS policy
 * already says "a user may write their own rows" (see 0008_notifications.sql),
 * so there's no privileged operation here worth a server-only key. The
 * route exists at all only because the service worker's registration API
 * only exists in the browser, and this is where that browser reports in.
 */
export async function POST(request: Request) {
  try {
    const { endpoint, p256dh, authKey, userAgent } = await request.json();
    if (!endpoint || !p256dh || !authKey) {
      return NextResponse.json({ error: "endpoint, p256dh and authKey required" }, { status: 400 });
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

    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        user_id: user.id,
        endpoint,
        p256dh,
        auth_key: authKey,
        user_agent: userAgent ?? "",
      },
      { onConflict: "endpoint" },
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
