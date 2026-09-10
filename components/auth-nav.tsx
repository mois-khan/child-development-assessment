"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/provider";
// Imported from the leaf modules, not the "@/components/ui" barrel: that
// barrel re-exports layout.tsx, which renders this component — going through
// it would make the import graph circular.
import { Avatar, Button, ButtonLink } from "@/components/ui/primitives";
import { IconArrowRight } from "@/components/ui/icons";

export function AuthNav() {
  const { user, profile, loading, signOut } = useAuth();
  const pathname = usePathname();

  // Reserves the bar's right-hand width while we find out who this is, so the
  // header doesn't jump once auth resolves.
  if (loading) return <span aria-hidden="true" className="h-9 w-[132px]" />;

  if (user) {
    const name = profile?.fullName || user.email || "Parent";
    return (
      <div className="flex items-center gap-2.5">
        <Link
          href="/profile"
          className="group hidden items-center gap-2.5 rounded-full py-1 pl-1 pr-3.5 transition-colors md:inline-flex"
          style={{ background: "var(--surface-2)" }}
        >
          <Avatar name={name} size={30} />
          <span className="max-w-[16ch] truncate text-sm font-bold text-ink transition-colors group-hover:text-accent">
            {profile?.fullName || user.email}
          </span>
        </Link>
        <Button
          variant="secondary"
          size="sm"
          onClick={async () => {
            await signOut();
            // A hard navigation, not router.push: the middleware now redirects
            // signed-in visitors off "/", and a client-side push can reach it
            // before the cleared auth cookie has made it back to the server —
            // which would bounce the parent who just signed out straight to
            // /dashboard. A full load guarantees the server sees no session.
            window.location.href = "/";
          }}
        >
          Sign out
        </Button>
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
