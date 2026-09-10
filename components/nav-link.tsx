"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * A top-bar navigation link that knows whether it is the current page.
 * Client-only because of usePathname — kept in its own file so the rest of the
 * design system stays server-renderable.
 */
export function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  // A link to a section of a page ("/#how") points INTO the current page
  // rather than at another one. Marking it current would light up two links
  // at once — the page's own link and every anchor on it.
  const isAnchor = href.includes("#");
  const target = href.split("#")[0] || "/";
  const active = isAnchor
    ? false
    : target === "/"
      ? pathname === "/"
      : (pathname?.startsWith(target) ?? false);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className="relative rounded-full px-4 py-2 text-sm font-bold transition-colors"
      style={{
        color: active ? "var(--accent)" : "var(--ink-2)",
        background: active ? "var(--accent-soft)" : "transparent",
      }}
    >
      {label}
    </Link>
  );
}
