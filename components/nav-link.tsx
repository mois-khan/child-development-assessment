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
  const target = href.split("#")[0] || "/";
  const active = target === "/" ? pathname === "/" : (pathname?.startsWith(target) ?? false);

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
