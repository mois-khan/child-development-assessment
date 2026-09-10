import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { notifyUser } from "@/lib/notifications/send";

/**
 * Fired right after a parent (or school) finishes a check — see
 * completeAssessment() in lib/data/assessments.ts, which calls this
 * fire-and-forget immediately after its own Supabase write succeeds.
 *
 * Completion itself stays a plain client-side Supabase update, same as
 * every other assessment write in this app — this route's only job is the
 * one step that update can't do itself: sending mail through the service
 * role and the VAPID private key, neither of which may reach the browser.
 *
 * Re-validates ownership server-side rather than trusting the client's
 * word for which assessment finished — the request is authenticated, but
 * "give me a notification for assessment X" is still a claim worth
 * checking before paying for a push send on the strength of it.
 */
export async function POST(request: Request) {
  try {
    const { assessmentId } = await request.json();
    if (!assessmentId) {
      return NextResponse.json({ error: "assessmentId required" }, { status: 400 });
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

    // RLS already limits this select to assessments the caller's own
    // children own, so a hit here is proof of ownership, not just a lookup.
    const { data: assessment } = await supabase
      .from("assessments")
      .select("id, status, child_id, children(name, profile_id)")
      .eq("id", assessmentId)
      .maybeSingle();

    const child = assessment?.children as unknown as { name: string; profile_id: string } | null;
    if (!assessment || assessment.status !== "complete" || !child || child.profile_id !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await notifyUser({
      userId: user.id,
      type: "report_ready",
      title: `${child.name}'s report is ready`,
      body: "Tap to see their phase, their strengths and what to work on next.",
      url: `/children/${assessment.child_id}`,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
