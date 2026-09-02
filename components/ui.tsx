import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { STATUSES } from "@/lib/scoring";
import type { DomainCode, StatusCode } from "@/lib/types";
import { DOMAIN_BY_CODE } from "@/content/domains";
import { ThemeToggle } from "@/components/theme-toggle";
import { NavLink } from "@/components/nav-link";

/* ── brand ──────────────────────────────────────────────────────────────── */

export function Wordmark() {
  return (
    <span className="inline-flex items-center">
      <Image src="/kgk-logo.svg" alt="Kaushalya Genius Kid Program" width={116} height={72} priority className="h-11 w-auto" />
    </span>
  );
}

/* ── status ─────────────────────────────────────────────────────────────── */

const STATUS_VAR: Record<StatusCode, string> = {
  on_track: "--st-on-track",
  emerging: "--st-emerging",
  needs_focus: "--st-needs-focus",
  consult: "--st-consult",
};

const STATUS_SOFT_VAR: Record<StatusCode, string> = {
  on_track: "--st-on-track-soft",
  emerging: "--st-emerging-soft",
  needs_focus: "--st-needs-focus-soft",
  consult: "--st-consult-soft",
};

export function statusColor(status: StatusCode): string {
  return `var(${STATUS_VAR[status]})`;
}

export function statusSoft(status: StatusCode): string {
  return `var(${STATUS_SOFT_VAR[status]})`;
}

export function StatusChip({
  status,
  solid = false,
}: {
  status: StatusCode;
  solid?: boolean;
}) {
  const c = statusColor(status);
  const style = solid
    ? ({
        "--chip-bg": c,
        "--chip-fg": "var(--on-status)",
        "--chip-bd": c,
      } as CSSProperties)
    : ({
        "--chip-bg": statusSoft(status),
        "--chip-fg": c,
        "--chip-bd": "transparent",
      } as CSSProperties);
  return (
    <span className="chip" style={style}>
      {STATUSES[status].label}
    </span>
  );
}

/* ── domain colour ──────────────────────────────────────────────────────── */

export function domainColor(code: DomainCode): string {
  return `oklch(0.58 0.115 ${DOMAIN_BY_CODE[code].hue})`;
}

export function DomainDot({ code }: { code: DomainCode }) {
  return (
    <span
      aria-hidden="true"
      className="inline-block size-2 shrink-0 rounded-full"
      style={{ background: domainColor(code) }}
    />
  );
}

/* ── feedback ───────────────────────────────────────────────────────────── */

/** A drawn-in tick. Used wherever an action has just been completed. */
export function Tick({
  size = 16,
  color = "var(--accent)",
  animate = true,
}: {
  size?: number;
  color?: string;
  animate?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      className={animate ? "tick shrink-0" : "shrink-0"}
    >
      <path
        d="M4.5 10.5 8.2 14.2 15.5 6.5"
        stroke={color}
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Confirmation that a step is finished. Answering seventy questions is a long
 * way to go on faith, so each section closing with an explicit "done" is the
 * difference between a chore and visible progress.
 */
export function DoneBanner({ children }: { children: ReactNode }) {
  return (
    <div
      className="animate-rise flex items-center gap-2.5 rounded-[12px] border px-4 py-3"
      style={{
        borderColor: "var(--accent-line)",
        background: "var(--accent-soft)",
      }}
      role="status"
    >
      <span className="animate-pop flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]">
        <Tick size={13} color="var(--on-status)" />
      </span>
      <p className="text-[0.88rem] font-medium leading-snug text-ink">
        {children}
      </p>
    </div>
  );
}

/* ── layout ─────────────────────────────────────────────────────────────── */

export function Shell({
  children,
  width = "reading",
}: {
  children: ReactNode;
  width?: "reading" | "wide";
}) {
  return (
    <div
      className={`mx-auto w-full px-5 sm:px-10 ${
        width === "reading" ? "max-w-[54rem]" : "max-w-[78rem]"
      }`}
    >
      {children}
    </div>
  );
}

const NAV_LINKS: [string, string][] = [
  ["/", "Home"],
  ["/children", "My Children"],
];

export function TopBar({
  right,
  bordered = true,
}: {
  right?: ReactNode;
  bordered?: boolean;
}) {
  return (
    <header
      className={`no-print sticky top-0 z-30 bg-[var(--ground)]/85 backdrop-blur-md ${
        bordered ? "border-b border-line" : ""
      }`}
    >
      <div className="mx-auto flex min-h-[4.25rem] w-full max-w-[78rem] flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-3 sm:px-10">
        <div className="flex items-center gap-7">
          <Link href="/" aria-label="Home">
            <Wordmark />
          </Link>
          <nav className="hidden items-center gap-5 sm:flex">
            {NAV_LINKS.map(([href, label]) => (
              <NavLink key={href} href={href} label={label} />
            ))}
          </nav>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {right}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

export function Disclaimer({ text }: { text: string }) {
  return (
    <div className="rounded-[12px] border border-line bg-surface-2 px-4 py-3.5">
      <p className="text-[0.78rem] leading-relaxed text-ink-3">
        <strong className="font-semibold text-ink-2">
          A screening tool, not a diagnosis.
        </strong>{" "}
        {text}
      </p>
    </div>
  );
}

/** A quiet horizontal rule that also carries a section label. */
export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="eyebrow">{children}</span>
      <span aria-hidden="true" className="h-px flex-1 bg-line" />
    </div>
  );
}

/* ── child / avatar ─────────────────────────────────────────────────────── */

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function Avatar({
  name,
  size = 40,
}: {
  name: string;
  size?: number;
}) {
  return (
    <span
      className="avatar-circle"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
      }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}

/** Small persistent card so a child feels present throughout the check. */
export function ChildCard({
  name,
  ageLabel,
  dobLabel,
  photoUrl,
  size = "md",
}: {
  name: string;
  ageLabel: string;
  dobLabel?: string;
  photoUrl?: string;
  size?: "sm" | "md";
}) {
  const avatarSize = size === "sm" ? 38 : 48;
  return (
    <div className="card flex items-center gap-3 !rounded-[var(--radius)] px-3.5 py-2.5">
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={name}
          className="shrink-0 rounded-full object-cover"
          style={{ width: avatarSize, height: avatarSize }}
        />
      ) : (
        <Avatar name={name} size={avatarSize} />
      )}
      <div className="min-w-0 leading-tight">
        <p className="truncate text-[0.94rem] font-bold text-ink">{name}</p>
        <p className="text-[0.76rem] text-ink-3">
          {ageLabel}
          {dobLabel && <span className="opacity-70"> · Born {dobLabel}</span>}
        </p>
      </div>
    </div>
  );
}

/** Wayfinding chip: which module (phase) and section the parent is in now. */
export function ModuleChip({
  moduleLabel,
  sectionLabel,
}: {
  moduleLabel: string;
  sectionLabel?: string;
}) {
  return (
    <span className="module-chip">
      <span
        aria-hidden="true"
        className="inline-block size-1.5 rounded-full bg-[var(--accent)]"
      />
      {moduleLabel}
      {sectionLabel && (
        <>
          <span aria-hidden="true" className="opacity-40">
            ·
          </span>
          {sectionLabel}
        </>
      )}
    </span>
  );
}
