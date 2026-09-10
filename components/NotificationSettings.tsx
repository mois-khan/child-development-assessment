"use client";

import { useEffect, useState } from "react";
import {
  isPushSubscribed,
  pushPermission,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/notifications/push-client";
import { Badge, Button, Card, IconBell } from "@/components/ui";

/**
 * One card, one job: let this browser opt in or out of push. The in-app
 * bell in the top bar works regardless of this setting — this only
 * controls whether the SAME notifications also show up as an OS-level
 * alert on this device. See lib/notifications/push-client.ts.
 */
export function NotificationSettings() {
  const [status, setStatus] = useState<"checking" | "unsupported" | "denied" | "off" | "on">("checking");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      const permission = pushPermission();
      if (permission === "unsupported") {
        if (active) setStatus("unsupported");
        return;
      }
      if (permission === "denied") {
        if (active) setStatus("denied");
        return;
      }
      const subscribed = await isPushSubscribed();
      if (active) setStatus(subscribed ? "on" : "off");
    })();
    return () => {
      active = false;
    };
  }, []);

  async function handleEnable() {
    setBusy(true);
    setError("");
    try {
      const ok = await subscribeToPush();
      setStatus(ok ? "on" : pushPermission() === "denied" ? "denied" : "off");
      if (!ok && pushPermission() !== "denied") {
        setError("Couldn't turn on notifications on this device. Try again in a moment.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleDisable() {
    setBusy(true);
    setError("");
    try {
      await unsubscribeFromPush();
      setStatus("off");
    } finally {
      setBusy(false);
    }
  }

  if (status === "unsupported") return null;

  return (
    <Card variant="clay" className="mt-5 flex flex-wrap items-center justify-between gap-4 p-6 sm:p-7">
      <div className="flex items-start gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[var(--accent-soft)] text-accent">
          <IconBell size={20} />
        </span>
        <div>
          <p className="text-base font-extrabold text-ink">Notifications on this device</p>
          <p className="mt-1 max-w-[46ch] text-sm text-ink-3">
            {status === "denied"
              ? "Blocked in your browser settings; this app can't ask again until you allow it there."
              : status === "on"
                ? "You'll get an alert on this device the moment a report is ready."
                : "Get an alert on this device the moment a report is ready; no need to keep checking back."}
          </p>
          {error && <p className="mt-1 text-sm font-semibold text-[var(--st-consult)]">{error}</p>}
        </div>
      </div>

      {status === "checking" ? null : status === "denied" ? (
        <Badge tone="warn">Blocked</Badge>
      ) : status === "on" ? (
        <Button variant="ghost" size="sm" onClick={handleDisable} disabled={busy}>
          {busy ? "Turning off…" : "Turn off"}
        </Button>
      ) : (
        <Button variant="secondary" size="sm" onClick={handleEnable} disabled={busy}>
          {busy ? "Turning on…" : "Turn on"}
        </Button>
      )}
    </Card>
  );
}
