"use client";

/**
 * PWA bootstrap: registers the service worker and captures the browser's
 * install prompt, both as soon as this module is first imported — see the
 * header note below on why that timing matters. Imported once, from
 * components/InstallPrompt.tsx, which components/ui/layout.tsx mounts at
 * the root so it loads on every page.
 *
 * `beforeinstallprompt` only fires once per page load, and if nothing calls
 * `preventDefault()` on it before the event finishes dispatching, the
 * browser shows its own generic install banner instead and the reference to
 * trigger install from OUR button is gone. Capturing it needs a listener
 * attached as early as this app's client JS can manage — a plain
 * module-level side effect, not something tucked inside a useEffect that
 * only runs after React has mounted the tree.
 */

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

let deferredEvent: BeforeInstallPromptEvent | null = null;
let everInstalled = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredEvent = e as BeforeInstallPromptEvent;
    notify();
  });

  window.addEventListener("appinstalled", () => {
    deferredEvent = null;
    everInstalled = true;
    notify();
  });

  if ("serviceWorker" in navigator) {
    // Fire-and-forget: nothing in this app blocks on the service worker
    // being ready. Registering it here (rather than only when a parent
    // opts into push) is what lets the browser consider the app
    // installable on the very first visit.
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }
}

/** True once the browser has told us this page can be installed. */
export function isInstallable(): boolean {
  return deferredEvent !== null;
}

/** True if the app is already running as an installed PWA (any platform). */
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const iosStandalone = (window.navigator as { standalone?: boolean }).standalone === true;
  return everInstalled || iosStandalone || window.matchMedia("(display-mode: standalone)").matches;
}

/**
 * Shows the browser's native install dialog. Only callable once per
 * captured event — the event is consumed either way, so the caller should
 * treat any non-"unavailable" outcome as "don't offer this again right now."
 */
export async function promptInstall(): Promise<"accepted" | "dismissed" | "unavailable"> {
  if (!deferredEvent) return "unavailable";
  const event = deferredEvent;
  deferredEvent = null;
  await event.prompt();
  const choice = await event.userChoice;
  return choice.outcome;
}

/** Re-render whenever installability changes — used by InstallPrompt. */
export function subscribeInstallability(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}
