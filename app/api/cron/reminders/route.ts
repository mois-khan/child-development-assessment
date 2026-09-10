import { NextResponse } from "next/server";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { notifyUser } from "@/lib/notifications/send";

/**
 * The one time-based notification in this app: nudge a family (or school)
 * back to a child who hasn't had a fresh check in a while. Runs on a
 * schedule (see vercel.json) rather than from any user action, which is
 * why it needs its own auth — there's no signed-in session to check
 * against, only a secret only Vercel's scheduler and this route know.
 *
 * Reminders are deduplicated per CHILD, not per user: a school with twenty
 * students due at different times should not have its account go silent
 * because one child got reminded recently. See shouldRemind() below.
 */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServiceRoleClient();
  const now = new Date();

  const { data: children, error: childrenError } = await supabase
    .from("children")
    .select("id, name, profile_id, created_at");
  if (childrenError) {
    return NextResponse.json({ error: childrenError.message }, { status: 500 });
  }
  if (!children || children.length === 0) {
    return NextResponse.json({ sent: 0, checked: 0 });
  }

  const { data: assessments } = await supabase
    .from("assessments")
    .select("child_id, completed_at")
    .eq("status", "complete");

  const lastCompletedByChild = new Map<string, Date>();
  for (const a of assessments ?? []) {
    if (!a.completed_at) continue;
    const at = new Date(a.completed_at);
    const prev = lastCompletedByChild.get(a.child_id);
    if (!prev || at > prev) lastCompletedByChild.set(a.child_id, at);
  }

  // Reminder notifications carry the child's page in `url` (see
  // notifyUser() calls below) — matched back to a child id by prefix
  // rather than a dedicated column, since this is the only place that
  // ever needs the link, and it isn't worth a schema column for one query.
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const { data: reminders } = await supabase
    .from("notifications")
    .select("url, created_at")
    .eq("type", "reminder")
    .gte("created_at", ninetyDaysAgo);

  const lastReminderByChild = new Map<string, Date>();
  for (const r of reminders ?? []) {
    const match = r.url?.match(/\/children\/([^/?]+)/);
    if (!match) continue;
    const at = new Date(r.created_at);
    const prev = lastReminderByChild.get(match[1]);
    if (!prev || at > prev) lastReminderByChild.set(match[1], at);
  }

  let sent = 0;
  for (const child of children) {
    const eligible = shouldRemind({
      lastCompletedAt: lastCompletedByChild.get(child.id) ?? null,
      lastReminderAt: lastReminderByChild.get(child.id) ?? null,
      childCreatedAt: new Date(child.created_at),
      now,
    });
    if (!eligible) continue;

    await notifyUser({
      userId: child.profile_id,
      type: "reminder",
      title: `Time for ${child.name}'s next check`,
      body: "A few minutes now keeps their phase and their report up to date.",
      url: `/children/${child.id}`,
    });
    sent++;
  }

  return NextResponse.json({ sent, checked: children.length });
}

interface ReminderContext {
  /** When this child's most recent COMPLETED check finished, or null if
   *  they have never finished one. */
  lastCompletedAt: Date | null;
  /** When this child last received a reminder push, or null if never. */
  lastReminderAt: Date | null;
  /** When the child was added — the only signal available for a child who
   *  has never been checked at all. */
  childCreatedAt: Date;
  now: Date;
}

/**
 * Quarterly cadence, monthly cooldown — picked rather than asked for, so
 * they're a starting point, not a spec:
 *
 *  - 90 days since the last completed check (or since signup, for a child
 *    never checked at all) before a nudge is due. Matches how fast a young
 *    child's development actually moves — a monthly nudge would be noise,
 *    a yearly one would miss a phase change entirely.
 *  - 30 days between reminders for the SAME child, so a family that ignores
 *    one nudge gets reminded again next month, not every single night this
 *    cron runs for the rest of the child's time on the platform.
 *
 * Tune these two constants directly; nothing else in this file assumes a
 * particular cadence.
 */
const REMINDER_AFTER_DAYS = 90;
const REMINDER_COOLDOWN_DAYS = 30;

function daysBetween(earlier: Date, later: Date): number {
  return (later.getTime() - earlier.getTime()) / (1000 * 60 * 60 * 24);
}

function shouldRemind(ctx: ReminderContext): boolean {
  const sinceLastCheck = daysBetween(ctx.lastCompletedAt ?? ctx.childCreatedAt, ctx.now);
  if (sinceLastCheck < REMINDER_AFTER_DAYS) return false;

  if (ctx.lastReminderAt && daysBetween(ctx.lastReminderAt, ctx.now) < REMINDER_COOLDOWN_DAYS) {
    return false;
  }

  return true;
}
