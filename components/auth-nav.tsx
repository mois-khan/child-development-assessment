"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/provider";
import { Avatar, ButtonLink } from "@/components/ui/primitives";
import { IconArrowRight } from "@/components/ui/icons";

export function AuthNav() {
  const { user, profile, loading } = useAuth();
  const pathname = usePathname();

  // Reserves the bar's right-hand width while we find out who this is, so the
  // header doesn't jump once auth resolves.
  if (loading) return <span aria-hidden="true" className="h-9 w-[132px]" />;

  if (user) {
    const name = profile?.fullName || user.email || "Parent";
    return (
      <div className="flex items-center gap-2.5">
        <Link
          href="/settings/account"
          className="group inline-flex items-center gap-2 rounded-full p-1 sm:py-1 sm:pl-1 sm:pr-3.5 transition-colors hover:bg-[var(--surface-2)]"
          style={{ background: "var(--surface-2)" }}
          title="Account settings"
        >
          <Avatar name={name} size={32} />
          <span className="hidden sm:inline max-w-[16ch] truncate text-sm font-bold text-ink transition-colors group-hover:text-accent">
            {profile?.fullName || user.email}
          </span>
        </Link>
      </div>
    );
  }

  if (pathname === "/join") return null;

  const targetNext =
    !pathname || pathname === "/" || pathname === "/join" ? "/dashboard" : pathname;

  // Secondary weight, not primary — "Sign in" sits next to a real page CTA
  // ("Get started" on the homepage) often enough that two solid buttons of
  // the same color read as two equally-important choices instead of one
  // primary action and a quieter way in for someone who already has an
  // account. The arrow is what makes it read as a door rather than a label.
  return (
    <ButtonLink
      href={`/join?next=${encodeURIComponent(targetNext)}`}
      variant="secondary"
      size="sm"
      iconRight={<IconArrowRight size={16} />}
    >
      Sign in
    </ButtonLink>
  );
}
