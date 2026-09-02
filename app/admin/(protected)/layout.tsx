"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useAdminSession } from "@/lib/admin/auth";
import {
  Badge,
  Button,
  IconBolt,
  IconChart,
  IconClock,
  IconLock,
  IconShield,
  IconUsers,
  Wordmark,
  cx,
} from "@/components/ui";

const NAV: { href: string; label: string; icon: ReactNode; soon?: boolean }[] = [
  { href: "/admin", label: "Dashboard", icon: <IconChart size={18} /> },
  { href: "/admin/submissions", label: "Submissions", icon: <IconUsers size={18} /> },
  { href: "/admin/item-bank", label: "Item bank", icon: <IconBolt size={18} /> },
  { href: "/admin/activities", label: "Activities & videos", icon: <IconClock size={18} />, soon: true },
  { href: "/admin/courses", label: "Courses", icon: <IconShield size={18} />, soon: true },
];

export default function AdminProtectedLayout({ children }: { children: ReactNode }) {
  const { session, loading, signOut } = useAdminSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !session) router.replace("/admin/login");
  }, [loading, session, router]);

  if (loading || !session) return null;

  return (
    <div className="flex min-h-screen bg-[var(--ground-2)]">
      <aside className="no-print hidden w-60 shrink-0 flex-col border-r border-line bg-[var(--surface)] px-4 py-6 md:flex">
        <Link href="/admin" className="mb-8 block px-2">
          <Wordmark height={34} />
        </Link>
        <nav className="flex flex-col gap-1">
          {NAV.map((item) => {
            const active = item.href === "/admin" ? pathname === "/admin" : pathname?.startsWith(item.href);
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
          <Button variant="ghost" size="sm" block onClick={() => signOut().then(() => router.replace("/admin/login"))}>
            Sign out
          </Button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <main className="px-5 py-8 sm:px-8 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
