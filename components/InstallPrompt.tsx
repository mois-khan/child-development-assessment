"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/provider";
import { listChildren } from "@/lib/store";
import { isInstallable, isStandalone, promptInstall, subscribeInstallability } from "@/lib/pwa/install";
import { Button, IconClose, IconDownload } from "@/components/ui";

const DISMISS_KEY = "kdsp-install-dismissed-at";
const DISMISS_COOLDOWN_DAYS = 30;

/**
 * The install nudge — never shown to a visitor deciding whether to sign up,
 * and never to a brand-new parent who hasn't added a child yet. Installing
 * only pays off once there's a report worth coming back for, and pitching
 * it any earlier would compete with, rather than follow, the actual reason
 * to want quick access and notifications on a home screen.
 *
 * Scoped to parent accounts specifically — a school more often manages a
 * roster from a desk, not a home screen, and nothing here stops that
 * changing later without touching anything else.
 */
export function InstallPrompt() {
  const { user, profile, loading } = useAuth();
  const [installable, setInstallable] = useState(isInstallable());
  const [hasChild, setHasChild] = useState(false);
  const [dismissed, setDismissed] = useState(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => subscribeInstallability(() => setInstallable(isInstallable())), []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DISMISS_KEY);
      if (!raw) {
        setDismissed(false);
        return;
      }
      const daysSince = (Date.now() - new Date(raw).getTime()) / 86_400_000;
      setDismissed(daysSince < DISMISS_COOLDOWN_DAYS);
    } catch {
      // Storage blocked (private mode, locked-down browser) — default to
      // showing rather than hiding the offer forever over a read failure.
      setDismissed(false);
    }
  }, []);

  useEffect(() => {
    if (!user || profile?.accountType !== "parent") {
      setHasChild(false);
      return;
    }
    let active = true;
    listChildren()
      .then((list) => active && setHasChild(list.length > 0))
      .catch(() => active && setHasChild(false));
    return () => {
      active = false;
    };
  }, [user, profile]);

  useEffect(() => {
    setVisible(
      !loading &&
        !!user &&
        profile?.accountType === "parent" &&
        hasChild &&
        installable &&
        !dismissed &&
        !isStandalone(),
    );
  }, [loading, user, profile, hasChild, installable, dismissed]);

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, new Date().toISOString());
    } catch {
      // Nothing to persist to — the banner just returns next page load,
      // which is a fair fallback rather than a broken one.
    }
    setVisible(false);
  }

  async function handleInstall() {
    const outcome = await promptInstall();
    if (outcome === "unavailable") return;
    // Accepted or dismissed, the native dialog is spent either way — the
    // OS won't show it again for this captured event, so there's nothing
    // left for this banner to offer until a future page load re-captures
    // beforeinstallprompt.
    dismiss();
  }

  if (!visible) return null;

  return (
    <div
      role="complementary"
      aria-label="Install this app"
      className="clay fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-md items-center gap-3 !p-4 sm:inset-x-auto sm:right-6"
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[var(--accent-soft)] text-accent">
        <IconDownload size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-extrabold text-ink">Add Kaushalya to your home screen</p>
        <p className="mt-0.5 text-xs leading-snug text-ink-3">
          Quick access to every report, no browser tab to hunt for.
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <Button size="sm" onClick={handleInstall}>
          Install
        </Button>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="grid size-8 place-items-center rounded-full text-ink-3 hover:bg-surface-2 hover:text-ink"
        >
          <IconClose size={16} />
        </button>
      </div>
    </div>
  );
}
