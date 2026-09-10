"use client";

/**
 * Browser push, client side: register the service worker, ask for
 * permission, subscribe with the VAPID public key, and hand the resulting
 * subscription to the server so lib/notifications/send.ts can find it later.
 *
 * Everything here is best-effort. A parent on a browser with no push
 * support (older Safari, some in-app webviews), or one who declines the
 * permission prompt, still gets every notification — just through the
 * in-app bell instead of an OS notification. See use-notifications.ts.
 */

export function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/** Current permission state, or "unsupported" on a browser with no push API. */
export function pushPermission(): NotificationPermission | "unsupported" {
  if (!pushSupported()) return "unsupported";
  return Notification.permission;
}

/**
 * Whether THIS browser currently holds a live subscription — distinct from
 * permission being granted, since a granted permission with no subscription
 * (e.g. cleared site data) still needs subscribeToPush() called again.
 */
export async function isPushSubscribed(): Promise<boolean> {
  if (!pushSupported()) return false;
  const registration = await navigator.serviceWorker.getRegistration("/sw.js");
  if (!registration) return false;
  const sub = await registration.pushManager.getSubscription();
  return sub !== null;
}

/**
 * Registers the service worker (idempotent — Chrome et al. no-op a second
 * register of the same script) and returns it once active.
 */
async function ensureServiceWorker(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration("/sw.js");
  if (existing) return existing;
  return navigator.serviceWorker.register("/sw.js");
}

/**
 * Asks for permission (if not already decided) and subscribes this browser
 * to push. Returns false without throwing when the user declines or the
 * browser can't do push at all — this is a nice-to-have the caller should
 * degrade gracefully around, not an error path.
 */
export async function subscribeToPush(): Promise<boolean> {
  if (!pushSupported()) return false;

  const permission =
    Notification.permission === "default" ? await Notification.requestPermission() : Notification.permission;
  if (permission !== "granted") return false;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey) return false;

  const registration = await ensureServiceWorker();
  await navigator.serviceWorker.ready;

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      // lib.dom types this as BufferSource, which structurally excludes a
      // plain Uint8Array<ArrayBufferLike> — the runtime accepts it fine;
      // this is a TypeScript lib gap, not a real type mismatch.
      applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
    });
  }

  const json = subscription.toJSON();
  const response = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      endpoint: json.endpoint,
      p256dh: json.keys?.p256dh,
      authKey: json.keys?.auth,
      userAgent: navigator.userAgent,
    }),
  });

  return response.ok;
}

/** Unsubscribes this browser and tells the server to forget it. */
export async function unsubscribeFromPush(): Promise<void> {
  if (!pushSupported()) return;
  const registration = await navigator.serviceWorker.getRegistration("/sw.js");
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return;

  const endpoint = subscription.endpoint;
  await subscription.unsubscribe();
  await fetch("/api/push/unsubscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint }),
  });
}

/** The one non-obvious step in subscribing: PushManager wants the VAPID
 *  public key as a Uint8Array, and the standard way to hand a key around as
 *  text is base64url — this converts between the two. */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}
