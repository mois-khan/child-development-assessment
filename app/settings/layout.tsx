"use client";

import { Suspense, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/provider";
import {
  Avatar,
  Footer,
  IconBell,
  IconRupee,
  IconSchool,
  IconShield,
  IconUser,
  Shell,
  TopBar,
} from "@/components/ui";

/* ── what this layout owns ───────────────────────────────────────────────────
 * Everything about the signed-in account itself: who they are, how they're
 * contacted, whether their browser gets push alerts, what they've paid for.
 * It does NOT own children or assessments — those live on /children and
 * /children/[id], the single source of truth for that data. A settings page
 * that also lists your kids is two pages pretending to be one.
 * ────────────────────────────────────────────────────────────────────────── */

const TABS = [
  { href: "/settings/account", label: "Account", icon: IconUser },
  { href: "/settings/notifications", label: "Notifications", icon: IconBell },
  { href: "/settings/billing", label: "Billing", icon: IconRupee },
] as const;

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <SettingsShell>{children}</SettingsShell>
    </Suspense>
  );
}

function SettingsShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, loading: authLoading } = useAuth();
  const isSchool = profile?.accountType === "school";

  useEffect(() => {
    if (!authLoading && user === null) {
      router.replace("/join?next=/settings/account");
    }
  }, [authLoading, user, router]);

  if (authLoading || (!user && !profile)) {
    return (
      <>
        <TopBar />
        <Shell>
          <p className="pt-24 text-center font-semibold text-ink-3">Loading settings…</p>
        </Shell>
      </>
    );
  }

  const name = isSchool
    ? profile?.school?.name || "Your school"
    : profile?.fullName || user?.user_metadata?.full_name || "Parent";

  return (
    <>
      <TopBar />

      <main className="pb-16">
        <Shell width="reading">
          <div className="mt-7 flex items-center gap-4">
            <Avatar name={name} size={56} ring />
            <div className="min-w-0">
              <p className="eyebrow eyebrow-accent flex items-center gap-1.5">
                {isSchool ? <IconSchool size={12} /> : <IconShield size={12} />}
                {isSchool ? "School account" : "Parent account"}
              </p>
              <h1 className="mt-0.5 truncate">{name}</h1>
            </div>
          </div>

          <nav className="mt-7 flex gap-1.5 overflow-x-auto border-b border-line-soft pb-px" aria-label="Settings">
            {TABS.map((tab) => {
              const active = pathname === tab.href;
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className="flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition-colors"
                  style={{
                    borderColor: active ? "var(--accent)" : "transparent",
                    color: active ? "var(--accent)" : "var(--ink-3)",
                  }}
                >
                  <Icon size={16} />
                  {tab.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-7">{children}</div>
        </Shell>
      </main>

      <Footer />
    </>
  );
}
