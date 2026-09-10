import webpush from "web-push";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/server";
import type { NotificationType } from "@/lib/supabase/database.types";

/**
 * Server-only. The one place anything in this app creates a notification —
 * see the header note in 0008_notifications.sql for why writes are
 * centralised here rather than left to whichever route needs one.
 *
 * Always writes the in-app row; ALSO pushes to every device the user has
 * subscribed, best-effort. A push failure never throws past this function —
 * the in-app notification already landed, which is the one guarantee this
 * app makes about "did the user get told".
 */

let vapidConfigured = false;
function ensureVapid() {
  if (vapidConfigured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) return;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
}

export interface NotifyInput {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  /** Relative path the notification should open, e.g. "/children/<id>". */
  url?: string;
}

export async function notifyUser({ userId, type, title, body = "", url }: NotifyInput): Promise<void> {
  const supabase = getSupabaseServiceRoleClient();

  const { error: insertError } = await supabase
    .from("notifications")
    .insert({ user_id: userId, type, title, body, url });
  if (insertError) {
    // The in-app row is the one thing this function must not silently
    // drop — if it failed to write, the caller (a route handler) should
    // know, but a broken push channel below must not look the same as a
    // broken database to whoever reads the logs.
    throw new Error(`notifyUser: failed to write notification: ${insertError.message}`);
  }

  ensureVapid();
  if (!vapidConfigured) return;

  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth_key")
    .eq("user_id", userId);
  if (!subscriptions || subscriptions.length === 0) return;

  const payload = JSON.stringify({ title, body, url: url ?? "/dashboard" });

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth_key },
          },
          payload,
        );
      } catch (err: any) {
        // 404/410 means the push service has permanently dropped this
        // endpoint (uninstalled browser, revoked permission, expired
        // registration) — anything else sending to it again would just
        // repeat the same failure, so it's cleaned up rather than retried.
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
        }
      }
    }),
  );
}
