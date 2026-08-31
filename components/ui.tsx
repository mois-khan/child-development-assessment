import type { CSSProperties, ReactNode } from "react";
import { STATUSES } from "@/lib/scoring";
import type { DomainCode, StatusCode } from "@/lib/types";
import { DOMAIN_BY_CODE } from "@/content/domains";

/* ── brand ──────────────────────────────────────────────────────────────── */

export function Wordmark() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <Sprout />
      <span className="leading-[1.15]">
        <span
          className="block text-[1.02rem] font-medium tracking-[-0.02em] text-ink"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Kaushalya Kids
        </span>
        <span className="block text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-ink-3">
          Genius Program
        </span>
      </span>
    </span>
  );
}

function Sprout() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        d="M12 21.5V11"
        stroke="var(--pine)"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M12 12.4c0-3.1-2.3-5.6-5.2-5.6-.4 3.1 1.9 5.6 5.2 5.6Z"
        fill="var(--pine)"
        opacity=".55"
      />
      <path
        d="M12 13.6c0-3.8 2.7-6.8 6.3-6.8.5 3.8-2.2 6.8-6.3 6.8Z"
        fill="var(--pine)"
      />
    </svg>
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
  color = "var(--pine)",
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
        borderColor: "var(--pine-line)",
        background: "var(--pine-soft)",
      }}
      role="status"
    >
      <span className="animate-pop flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--pine)]">
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
      className={`mx-auto w-full px-5 sm:px-8 ${
        width === "reading" ? "max-w-[42rem]" : "max-w-[64rem]"
      }`}
    >
      {children}
    </div>
  );
}

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
      <div className="mx-auto flex h-[4.25rem] w-full max-w-[64rem] items-center justify-between gap-4 px-5 sm:px-8">
        <Wordmark />
        {right}
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
