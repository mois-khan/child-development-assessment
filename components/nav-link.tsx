"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname?.startsWith(href);
  return (
    <Link
      href={href}
      className="text-[0.9rem] font-semibold transition-colors"
      style={{ color: active ? "var(--accent)" : "var(--ink-3)" }}
    >
      {label}
    </Link>
  );
}
