"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/provider";
import { NavLink } from "@/components/nav-link";

/**
 * The top bar's links, which are not the same set for everyone.
 *
 * This used to be a constant inside the server-rendered TopBar, which meant
 * "My children" and "Parent profile" were advertised to visitors who had no
 * account and would be bounced straight to /join by the middleware. Who is
 * signed in is only knowable on the client, so the link list has to live on
 * this side of the boundary with it.
 *
 * Signed out, the links point at the parts of the landing page a visitor is
 * deciding between. Signed in, they point at the three places a parent
 * actually works.
 */
const SIGNED_OUT: [string, string][] = [
  ["/", "Home"],
  ["/#how", "How it works"],
  ["/#areas", "The six areas"],
];

const SIGNED_IN: [string, string][] = [
  ["/dashboard", "Dashboard"],
  ["/children", "My children"],
  ["/profile", "Parent profile"],
];

export function MainNav() {
  const { user, loading } = useAuth();

  // Rendering the signed-out set while we find out, then swapping it, makes
  // the bar visibly rewrite itself on every load. An empty nav for that beat
  // is quieter, and the logo and auth buttons hold the bar's height anyway.
  if (loading) return <nav className="hidden md:flex" aria-hidden="true" />;

  const links = user ? SIGNED_IN : SIGNED_OUT;

  return (
    <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
      {links.map(([href, label]) => (
        <NavLink key={href} href={href} label={label} />
      ))}
    </nav>
  );
}

/**
 * The same destinations for a phone, as a strip under the bar.
 *
 * The desktop nav is `md:flex`, so below that breakpoint a signed-in parent
 * had no way to reach their dashboard or their children at all — the header
 * was a logo and a sign-out button. Rather than hide navigation behind a
 * hamburger for three links, they get their own row.
 *
 * Signed-out visitors don't get this strip: their links are anchors into the
 * page they are already scrolling, and a second sticky row above a hero costs
 * more than it gives.
 */
export function MobileNav() {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  if (loading || !user) return null;

  return (
    <nav
      className="flex items-center gap-1.5 overflow-x-auto border-t border-line-soft px-4 py-2 md:hidden"
      aria-label="Main"
    >
      {SIGNED_IN.map(([href, label]) => {
        const active = pathname === href || pathname?.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            // 40px tall with the padding below, which keeps the row itself
            // short while the link's own tap area stays comfortable.
            className="shrink-0 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-bold transition-colors"
            style={{
              color: active ? "var(--accent)" : "var(--ink-2)",
              background: active ? "var(--accent-soft)" : "transparent",
            }}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
