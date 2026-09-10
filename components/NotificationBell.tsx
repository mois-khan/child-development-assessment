"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/provider";
import { useNotifications, type AppNotification } from "@/lib/notifications/use-notifications";
import { IconBell, IconCheck } from "@/components/ui/icons";

/**
 * The always-on notification channel — sits in the top bar for every
 * signed-in account (parent, school, or staff... though staff have their
 * own header entirely, so in practice parents and schools). Renders
 * nothing while signed out: there's no inbox to show, and no query to run.
 */
export function NotificationBell() {
  const { user, loading: authLoading } = useAuth();
  const { items, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  if (authLoading || !user) return null;

  async function onSelect(n: AppNotification) {
    setOpen(false);
    if (!n.readAt) await markRead(n.id);
    if (n.url) router.push(n.url);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
        aria-expanded={open}
        className="relative grid size-9 place-items-center rounded-full text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
      >
        <IconBell size={19} />
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className="tnum absolute right-1 top-1 grid min-w-[16px] place-items-center rounded-full px-1 text-[10px] font-extrabold leading-[16px] text-white"
            style={{ background: "var(--coral-500)" }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="clay absolute right-0 top-[calc(100%+10px)] z-50 w-[22rem] max-w-[90vw] overflow-hidden !p-0"
        >
          <div className="flex items-center justify-between border-b border-line-soft px-4 py-3">
            <p className="text-sm font-extrabold text-ink">Notifications</p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllRead()}
                className="text-xs font-bold text-accent hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="thin-scroll max-h-[24rem] overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-ink-3">
                Nothing yet — check back after your next report.
              </p>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => onSelect(n)}
                  className="flex w-full items-start gap-3 border-b border-line-soft px-4 py-3 text-left transition-colors last:border-0 hover:bg-surface-2"
                >
                  <span
                    aria-hidden="true"
                    className="mt-1.5 size-2 shrink-0 rounded-full"
                    style={{ background: n.readAt ? "transparent" : "var(--accent)" }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-ink">{n.title}</span>
                    {n.body && (
                      <span className="mt-0.5 block text-xs leading-relaxed text-ink-3">{n.body}</span>
                    )}
                    <span className="mt-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-3">
                      {relativeTime(n.createdAt)}
                    </span>
                  </span>
                  {n.readAt && (
                    <span className="mt-1 shrink-0 text-[var(--st-on-track)]">
                      <IconCheck size={14} />
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
