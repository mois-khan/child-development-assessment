import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import type { DomainCode, StatusCode } from "@/lib/types";
import { DOMAIN_BY_CODE } from "@/content/domains";
import {
  IconAuditory,
  IconCheck,
  IconLanguage,
  IconManual,
  IconMobility,
  IconTactile,
  IconVisual,
  type IconProps,
} from "./icons";

/* ══ buttons ═══════════════════════════════════════════════════════════════ */

type ButtonVariant = "primary" | "sun" | "secondary" | "soft" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: "btn-primary",
  sun: "btn-sun",
  secondary: "btn-secondary",
  soft: "btn-soft",
  ghost: "btn-ghost",
};

const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: "btn-sm",
  md: "",
  lg: "btn-lg",
};

interface ButtonBaseProps {
  children?: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  block,
  iconLeft,
  iconRight,
  className = "",
  style,
  type = "button",
  ...rest
}: ButtonBaseProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children" | "style">) {
  return (
    <button
      type={type}
      className={cx("btn", VARIANT_CLASS[variant], SIZE_CLASS[size], block && "btn-block", className)}
      style={style}
      {...rest}
    >
      {iconLeft}
      {children}
      {iconRight}
    </button>
  );
}

/** Same shape as Button, but navigates. Keeps the two visually identical. */
export function ButtonLink({
  children,
  href,
  variant = "primary",
  size = "md",
  block,
  iconLeft,
  iconRight,
  className = "",
  style,
  external,
  ...rest
}: ButtonBaseProps & {
  href: string;
  external?: boolean;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "children" | "style" | "href">) {
  const classes = cx(
    "btn",
    VARIANT_CLASS[variant],
    SIZE_CLASS[size],
    block && "btn-block",
    className,
  );
  const inner = (
    <>
      {iconLeft}
      {children}
      {iconRight}
    </>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={classes} style={style} {...rest}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={href} className={classes} style={style} {...rest}>
      {inner}
    </Link>
  );
}

/* ══ surfaces ══════════════════════════════════════════════════════════════ */

type CardVariant = "flat" | "clay" | "tint";

export function Card({
  children,
  variant = "flat",
  tint,
  interactive,
  className = "",
  style,
  ...rest
}: {
  children: ReactNode;
  variant?: CardVariant;
  /** CSS colour for the `tint` variant's wash. */
  tint?: string;
  interactive?: boolean;
  className?: string;
  style?: CSSProperties;
} & Omit<React.HTMLAttributes<HTMLDivElement>, "children" | "style">) {
  const base = variant === "clay" ? "clay" : variant === "tint" ? "tint" : "card";
  return (
    <div
      className={cx(base, interactive && "clay-press cursor-pointer", className)}
      style={{ ...(tint ? ({ "--tint-color": tint } as CSSProperties) : null), ...style }}
      {...rest}
    >
      {children}
    </div>
  );
}

/* ══ badges ════════════════════════════════════════════════════════════════ */

type BadgeTone = "neutral" | "accent" | "success" | "warn" | "danger" | "sun";

const TONE_VARS: Record<BadgeTone, { fg: string; bg: string }> = {
  neutral: { fg: "var(--ink-2)", bg: "var(--surface-2)" },
  accent: { fg: "var(--accent-hover)", bg: "var(--accent-soft)" },
  success: { fg: "var(--st-on-track)", bg: "var(--st-on-track-soft)" },
  warn: { fg: "var(--st-emerging)", bg: "var(--st-emerging-soft)" },
  danger: { fg: "var(--st-consult)", bg: "var(--st-consult-soft)" },
  sun: { fg: "var(--sun-700)", bg: "var(--sun-100)" },
};

export function Badge({
  children,
  tone = "neutral",
  color,
  size = "sm",
  icon,
  className = "",
}: {
  children: ReactNode;
  tone?: BadgeTone;
  /** Overrides `tone` with an arbitrary colour (used for section hues). */
  color?: string;
  size?: "sm" | "lg";
  icon?: ReactNode;
  className?: string;
}) {
  const fg = color ?? TONE_VARS[tone].fg;
  const bg = color ? `color-mix(in srgb, ${color} 13%, var(--surface))` : TONE_VARS[tone].bg;
  return (
    <span
      className={cx("chip", size === "lg" && "chip-lg", className)}
      style={
        {
          "--chip-fg": fg,
          "--chip-bg": bg,
          "--chip-bd": "transparent",
        } as CSSProperties
      }
    >
      {icon}
      {children}
    </span>
  );
}

const STATUS_TONE: Record<StatusCode, BadgeTone> = {
  on_track: "success",
  emerging: "warn",
  needs_focus: "warn",
  consult: "danger",
};

const STATUS_VAR: Record<StatusCode, string> = {
  on_track: "--st-on-track",
  emerging: "--st-emerging",
  needs_focus: "--st-needs-focus",
  consult: "--st-consult",
};

export function statusColor(status: StatusCode): string {
  return `var(${STATUS_VAR[status]})`;
}

export function statusSoft(status: StatusCode): string {
  return `var(${STATUS_VAR[status]}-soft)`;
}

export function StatusChip({
  status,
  label,
  solid = false,
  size = "sm",
}: {
  status: StatusCode;
  label: string;
  solid?: boolean;
  size?: "sm" | "lg";
}) {
  if (solid) {
    return (
      <span
        className={cx("chip", size === "lg" && "chip-lg")}
        style={
          {
            "--chip-bg": statusColor(status),
            "--chip-fg": "var(--on-status)",
            "--chip-bd": "transparent",
          } as CSSProperties
        }
      >
        {label}
      </span>
    );
  }
  return (
    <Badge tone={STATUS_TONE[status]} size={size}>
      {label}
    </Badge>
  );
}

/* ══ progress ══════════════════════════════════════════════════════════════ */

export function Meter({
  value,
  max = 100,
  color,
  className = "",
  label,
}: {
  value: number;
  max?: number;
  color?: string;
  className?: string;
  label?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div
      className={cx("meter-track", className)}
      role="img"
      aria-label={label ?? `${Math.round(pct)} percent`}
    >
      <div
        className="meter-fill"
        style={{
          width: `${pct}%`,
          ...(color
            ? { background: `linear-gradient(90deg, color-mix(in srgb, ${color} 68%, white), ${color})` }
            : null),
        }}
      />
    </div>
  );
}

export function ProgressRing({
  value,
  size = 56,
  stroke = 6,
  color = "var(--accent)",
  track = "var(--surface-3)",
  children,
}: {
  /** 0-100 */
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (pct / 100) * circumference}
          style={{ transition: "stroke-dashoffset 600ms cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center">{children}</span>
    </div>
  );
}

/* ══ avatar & child card ═══════════════════════════════════════════════════ */

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function Avatar({
  name,
  photoUrl,
  size = 44,
  ring = false,
  className = "",
}: {
  name: string;
  photoUrl?: string;
  size?: number;
  ring?: boolean;
  className?: string;
}) {
  const ringStyle: CSSProperties = ring
    ? { boxShadow: "0 0 0 3px var(--surface), 0 0 0 6px var(--accent-line)" }
    : {};

  if (photoUrl) {
    return (
      // Data-URL photos from the device; next/image gives nothing here.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={name}
        width={size}
        height={size}
        className={cx("shrink-0 rounded-full object-cover", className)}
        style={{ width: size, height: size, ...ringStyle }}
      />
    );
  }
  return (
    <span
      className={cx("avatar-circle", className)}
      style={{ width: size, height: size, fontSize: size * 0.38, ...ringStyle }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}

export function ChildCard({
  name,
  ageLabel,
  dobLabel,
  photoUrl,
  compact = false,
  className = "",
}: {
  name: string;
  ageLabel: string;
  dobLabel?: string;
  photoUrl?: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "card flex items-center gap-3",
        compact ? "px-3 py-2" : "px-4 py-3",
        className,
      )}
    >
      <Avatar name={name} photoUrl={photoUrl} size={compact ? 38 : 46} />
      <div className="min-w-0 leading-tight">
        <p className={cx("truncate font-bold text-ink", compact ? "text-[0.9rem]" : "text-[1rem]")}>
          {name}
        </p>
        <p className="text-[0.76rem] font-medium text-ink-3">
          {ageLabel}
          {dobLabel && <span className="opacity-75"> · born {dobLabel}</span>}
        </p>
      </div>
    </div>
  );
}

/* ══ sections (the six areas) ══════════════════════════════════════════════ */

const SECTION_ICON: Record<DomainCode, (p: IconProps) => React.JSX.Element> = {
  vision: IconVisual,
  auditory: IconAuditory,
  social: IconTactile,
  mobility: IconMobility,
  language: IconLanguage,
  hand: IconManual,
};

const SECTION_COLOR: Record<DomainCode, string> = {
  vision: "var(--sec-visual)",
  auditory: "var(--sec-auditory)",
  social: "var(--sec-tactile)",
  mobility: "var(--sec-mobility)",
  language: "var(--sec-language)",
  hand: "var(--sec-manual)",
};

export function domainColor(code: DomainCode): string {
  return SECTION_COLOR[code];
}

export function SectionIcon({
  code,
  size = 22,
  className = "",
}: {
  code: DomainCode;
  size?: number;
  className?: string;
}) {
  const Icon = SECTION_ICON[code];
  return <Icon size={size} className={className} />;
}

/** Icon in a soft, section-coloured clay tile. The product's visual signature. */
export function SectionTile({
  code,
  size = 56,
  className = "",
}: {
  code: DomainCode;
  size?: number;
  className?: string;
}) {
  const color = SECTION_COLOR[code];
  return (
    <span
      // "section-tile" is a stable hook for the print stylesheet — the
      // colours below are inline (computed per section), so print can only
      // reach them via a class name + !important, not a CSS variable.
      className={cx("section-tile grid shrink-0 place-items-center", className)}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.32,
        color,
        background: `color-mix(in srgb, ${color} 14%, var(--surface))`,
        boxShadow: `0 4px 10px -6px color-mix(in srgb, ${color} 55%, transparent)`,
      }}
      aria-hidden="true"
    >
      <SectionIcon code={code} size={size * 0.46} />
    </span>
  );
}

export function DomainDot({ code }: { code: DomainCode }) {
  return (
    <span
      aria-hidden="true"
      className="inline-block size-2.5 shrink-0 rounded-full"
      style={{ background: SECTION_COLOR[code] }}
    />
  );
}

export function domainName(code: DomainCode): string {
  return DOMAIN_BY_CODE[code].name;
}

/* ══ feedback ══════════════════════════════════════════════════════════════ */

export function Tick({
  size = 18,
  color = "var(--accent)",
  animate = true,
}: {
  size?: number;
  color?: string;
  animate?: boolean;
}) {
  return (
    <span className={animate ? "tick inline-flex" : "inline-flex"} style={{ color }}>
      <IconCheck size={size} />
    </span>
  );
}

export function DoneBanner({ children }: { children: ReactNode }) {
  return (
    <div
      className="animate-rise flex items-center gap-3 rounded-[var(--radius)] border px-4 py-3.5"
      style={{ borderColor: "var(--accent-line)", background: "var(--accent-soft)" }}
      role="status"
    >
      <span className="animate-pop grid size-8 shrink-0 place-items-center rounded-full bg-[var(--accent)] text-white">
        <IconCheck size={17} />
      </span>
      <p className="text-[0.92rem] font-bold leading-snug text-ink">{children}</p>
    </div>
  );
}

export function Stat({
  value,
  label,
  color = "var(--accent)",
  icon,
}: {
  value: ReactNode;
  label: string;
  color?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="text-center">
      {icon && (
        <span className="mb-2 inline-grid size-10 place-items-center rounded-2xl" style={{ color, background: `color-mix(in srgb, ${color} 12%, var(--surface))` }}>
          {icon}
        </span>
      )}
      <p className="tnum text-[1.75rem] font-extrabold leading-none" style={{ fontFamily: "var(--font-display)", color }}>
        {value}
      </p>
      <p className="mt-1.5 text-[0.82rem] font-semibold text-ink-3">{label}</p>
    </div>
  );
}

/* ══ util ══════════════════════════════════════════════════════════════════ */

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}
