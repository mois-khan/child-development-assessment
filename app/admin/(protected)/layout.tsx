"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useAdminSession, type AdminSession } from "@/lib/admin/auth";
import {
  Badge,
  Button,
  IconBolt,
  IconChart,
  IconClose,
  IconLock,
  IconMenu,
  IconPhone,
  Wordmark,
  cx,
} from "@/components/ui";

/**
 * Three sections, deliberately. Courses, Activities and Videos were removed:
 * they were content-management surfaces competing for attention with the two
 * things this panel exists to do — manage the question bank, and work the
 * lead pipeline. Submissions folded into Leads, because a submission with no
 * parent attached to it isn't something anyone acts on.
 */
const NAV: { href: string; label: string; icon: ReactNode; soon?: boolean }[] = [
  { href: "/admin", label: "Dashboard", icon: <IconChart size={18} /> },
  { href: "/admin/leads", label: "Leads", icon: <IconPhone size={18} /> },
  { href: "/admin/item-bank", label: "Question bank", icon: <IconBolt size={18} /> },
];

export default function AdminProtectedLayout({ children }: { children: ReactNode }) {
  const { session, loading, signOut } = useAdminSession();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !session) router.replace("/admin/login");
  }, [loading, session, router]);

  // A route change is the one thing that should always close the drawer —
  // otherwise the admin taps a link, lands on the new page, and it's still
  // sitting open over the top of it.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (loading || !session) return null;

  const isActive = (href: string) =>
    href === "/admin"
      ? pathname === "/admin"
      : (pathname?.startsWith(href) ?? false);

  return (
    <div className="flex min-h-screen bg-[var(--ground-2)]">
      {/* ── desktop sidebar ─────────────────────────────────────────────── */}
      <aside className="no-print hidden w-60 shrink-0 flex-col border-r border-line bg-[var(--surface)] px-4 py-6 md:flex">
        <Link href="/admin" className="mb-8 block px-2">
          <Wordmark height={34} />
        </Link>
        <AdminNav nav={NAV} isActive={isActive} />
        <AdminSessionFooter session={session} onSignOut={() => signOut().then(() => router.replace("/admin/login"))} />
      </aside>

      {/* ── mobile top bar ──────────────────────────────────────────────── */}
      <header className="no-print sticky top-0 z-40 flex w-full items-center justify-between border-b border-line bg-[var(--surface)] px-4 py-3 md:hidden">
        <Link href="/admin">
          <Wordmark height={28} />
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          aria-expanded={mobileOpen}
          className="grid size-10 place-items-center rounded-full text-ink-2 hover:bg-surface-2"
        >
          <IconMenu size={22} />
        </button>
      </header>

      {/* ── mobile drawer ───────────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="no-print fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <aside className="animate-slide-in-left absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-[var(--surface)] px-4 py-6 shadow-2xl">
            <div className="mb-8 flex items-center justify-between px-2">
              <Wordmark height={30} />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="grid size-9 place-items-center rounded-full text-ink-2 hover:bg-surface-2"
              >
                <IconClose size={18} />
              </button>
            </div>
            <AdminNav nav={NAV} isActive={isActive} />
            <AdminSessionFooter
              session={session}
              onSignOut={() => signOut().then(() => router.replace("/admin/login"))}
            />
          </aside>
        </div>
      )}

      <div className="min-w-0 flex-1">
        <main className="px-5 py-8 sm:px-8 lg:px-10">{children}</main>
      </div>
    </div>
  );
}

/** The nav list itself — identical markup on desktop and inside the mobile drawer. */
function AdminNav({
  nav,
  isActive,
}: {
  nav: typeof NAV;
  isActive: (href: string) => boolean;
}) {
  return (
    <nav className="flex flex-col gap-1">
      {nav.map((item) => {
        const active = isActive(item.href);
        if (item.soon) {
          return (
            <span
              key={item.href}
              className="flex items-center justify-between gap-2 rounded-2xl px-3 py-2.5 text-[0.9rem] font-semibold text-ink-3 opacity-60"
            >
              <span className="flex items-center gap-2.5">
                {item.icon}
                {item.label}
              </span>
              <Badge size="sm">Soon</Badge>
            </span>
          );
        }
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cx(
              "flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-[0.9rem] font-semibold transition-colors",
              active ? "bg-[var(--accent-soft)] text-[var(--accent-hover)]" : "text-ink-2 hover:bg-surface-2",
            )}
          >
            {item.icon}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Session identity + sign out — the bottom block on both the desktop sidebar and the mobile drawer. */
function AdminSessionFooter({
  session,
  onSignOut,
}: {
  session: AdminSession;
  onSignOut: () => void;
}) {
  return (
    <div className="mt-auto space-y-3 border-t border-line pt-4">
      {session.isDevSession && (
        <Badge tone="warn" icon={<IconLock size={13} />} className="w-full !justify-center">
          Dev session
        </Badge>
      )}
      <div className="px-1">
        <p className="truncate text-[0.82rem] font-semibold text-ink">{session.email}</p>
        <p className="text-[0.72rem] uppercase tracking-wide text-ink-3">{session.role}</p>
      </div>
      <Button variant="ghost" size="sm" block onClick={onSignOut}>
        Sign out
      </Button>
    </div>
  );
}
