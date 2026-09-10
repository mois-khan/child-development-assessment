/**
 * The push service worker.
 *
 * Deliberately tiny and dependency-free — it isn't a PWA shell or an
 * offline cache, just the one thing only a service worker can do: receive a
 * push while the tab is closed and turn it into an OS-level notification.
 * Everything else (subscribing, the in-app bell, marking read) happens in
 * normal page JS — see lib/notifications/.
 */

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
