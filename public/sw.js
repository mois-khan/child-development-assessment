/**
 * The service worker — push delivery, and the one thing a PWA needs from a
 * service worker to be installable at all.
 *
 * Deliberately not an offline cache: this app's every page depends on a
 * live, authenticated Supabase session, so a cached shell would either show
 * a stale sign-in state or a stale report — worse than "you're offline."
 * The fetch listener below exists only to be present, not to do anything.
 */

self.addEventListener("fetch", () => {
  // No-op passthrough — every request goes to the network exactly as if
  // this listener didn't exist. See the header note above for why.
});

self.addEventListener("push", (event) => {
  let payload = { title: "Kaushalya", body: "", url: "/dashboard" };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch {
    // A push with no JSON body (or none at all) still shows something
    // rather than silently dropping — better an unhelpful notification
    // than a permission the user granted that appears to do nothing.
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/kgk-logo.svg",
      badge: "/kgk-logo.svg",
      data: { url: payload.url || "/dashboard" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    (async () => {
      const clientsList = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      // Focus an existing tab rather than always opening a new one — a
      // parent who already has the app open shouldn't collect a second tab
      // per notification they click.
      for (const client of clientsList) {
        if ("focus" in client) {
          await client.focus();
          if ("navigate" in client) await client.navigate(url);
          return;
        }
      }
      await self.clients.openWindow(url);
    })(),
  );
});
