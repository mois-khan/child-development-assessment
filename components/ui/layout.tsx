import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { NavLink } from "@/components/nav-link";
import { cx } from "./primitives";

/* ══ brand ═════════════════════════════════════════════════════════════════ */

export function Wordmark({ height = 46 }: { height?: number }) {
  return (
    <span className="brand-plate">
      <Image
        src="/kgk-logo.svg"
        alt="Kaushalya Genius Kid Program"
        width={Math.round(height * 1.62)}
        height={height}
        priority
        // Both axes declared so Next.js can keep the intrinsic aspect ratio.
        style={{ height, width: "auto", maxWidth: "none" }}
      />
    </span>
  );
}

/* ══ containers ════════════════════════════════════════════════════════════ */

const WIDTHS = {
  narrow: "max-w-[46rem]",
  reading: "max-w-[58rem]",
  wide: "max-w-[78rem]",
  full: "max-w-[92rem]",
} as const;

export function Shell({
  children,
  width = "reading",
  className = "",
}: {
  children: ReactNode;
  width?: keyof typeof WIDTHS;
  className?: string;
}) {
  return (
    <div className={cx("mx-auto w-full px-5 sm:px-8 lg:px-12", WIDTHS[width], className)}>
      {children}
    </div>
  );
}

/** Vertical rhythm between page sections, so spacing never drifts per page. */
export function Section({
  children,
  className = "",
  size = "md",
  id,
}: {
  children: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
  id?: string;
}) {
  const pad = size === "sm" ? "py-10 sm:py-14" : size === "lg" ? "py-20 sm:py-28" : "py-14 sm:py-20";
  return (
    <section id={id} className={cx(pad, className)}>
      {children}
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className = "",
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div className={cx(align === "center" && "mx-auto text-center", "max-w-[46rem]", className)}>
      {eyebrow && <p className="eyebrow eyebrow-accent mb-3">{eyebrow}</p>}
      <h2>{title}</h2>
      {description && <p className="lede mt-3.5">{description}</p>}
    </div>
  );
}

/* ══ top bar ═══════════════════════════════════════════════════════════════ */

const NAV_LINKS: [string, string][] = [
  ["/", "Home"],
  ["/children", "My children"],
];

export function TopBar({
  right,
  bordered = true,
  nav = true,
}: {
  right?: ReactNode;
  bordered?: boolean;
  nav?: boolean;
}) {
  return (
    <header
      className={cx(
        "no-print sticky top-0 z-40 backdrop-blur-xl",
        bordered && "border-b border-line",
      )}
      style={{ background: "color-mix(in srgb, var(--ground) 82%, transparent)" }}
    >
      <div className="mx-auto flex min-h-[4.75rem] w-full max-w-[92rem] items-center justify-between gap-4 px-5 py-3 sm:px-8 lg:px-12">
        <div className="flex items-center gap-8">
          <Link href="/" aria-label="Kaushalya Genius Kid Program — home" className="shrink-0">
            <Wordmark />
          </Link>
          {nav && (
            <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
              {NAV_LINKS.map(([href, label]) => (
                <NavLink key={href} href={href} label={label} />
              ))}
            </nav>
          )}
        </div>
        <div className="flex items-center gap-2">
          {right}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

/* ══ footer ════════════════════════════════════════════════════════════════ */

export function Footer() {
  return (
    <footer className="no-print border-t border-line bg-[var(--surface)]">
      <Shell width="wide">
        <div className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <Wordmark height={50} />
            <p className="mt-4 max-w-[34ch] text-[0.9rem] leading-relaxed text-ink-2">
              A gentle revolution to make the world a better place — helping every child
              actualise the genius they were born with, in the first six golden years.
            </p>
          </div>

          <div>
            <h3 className="text-[0.95rem]">Programme</h3>
            <ul className="mt-3 list-none space-y-2 p-0 text-[0.88rem] text-ink-2">
              <li>
                <Link href="/children" className="hover:text-accent">
                  Milestone check
                </Link>
              </li>
              <li>
                <a
                  href="https://www.kaushalyageniuskid.com"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-accent"
                >
                  KGKP method
                </a>
              </li>
              <li>
                <a
                  href="https://www.kaushalyageniuskid.com"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-accent"
                >
                  Courses
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-[0.95rem]">Support</h3>
            <ul className="mt-3 list-none space-y-2 p-0 text-[0.88rem] text-ink-2">
              <li>
                <a href="mailto:support@kaushalyageniuskid.com" className="hover:text-accent">
                  support@kaushalyageniuskid.com
                </a>
              </li>
              <li>
                <a href="tel:+919394360043" className="hover:text-accent">
                  +91 93943 60043
                </a>
              </li>
              <li className="text-ink-3">Mon–Sat, 11am–5pm IST</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-soft py-6 text-[0.78rem] text-ink-3">
          <p>© {new Date().getFullYear()} Kaushalya Genius Kid Program. All rights reserved.</p>
          <p>A screening tool, not a medical diagnosis.</p>
        </div>
      </Shell>
    </footer>
  );
}

/* ══ misc ══════════════════════════════════════════════════════════════════ */

export function Disclaimer({ text }: { text: string }) {
  return (
    <div className="rounded-[var(--radius)] border border-line bg-[var(--surface-2)] px-5 py-4">
      <p className="text-[0.8rem] leading-relaxed text-ink-3">
        <strong className="font-bold text-ink-2">A screening tool, not a diagnosis.</strong> {text}
      </p>
    </div>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-4">
      <span className="eyebrow">{children}</span>
      <span aria-hidden="true" className="h-px flex-1 bg-line" />
    </div>
  );
}
