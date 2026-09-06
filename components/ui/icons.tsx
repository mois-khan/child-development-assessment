import type { SVGProps } from "react";

/**
 * One icon family, drawn for this product.
 *
 * All icons share a 24×24 box, 1.8px stroke, round caps and round joins, so
 * they sit together without any one looking borrowed. `currentColor`
 * throughout — colour comes from the element they sit in, never from here.
 *
 * Emoji are deliberately not used anywhere as interface icons: they render
 * differently on every platform and cannot be themed.
 */

export type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 22, children, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

/* ── the six sections ────────────────────────────────────────────────────── */

export function IconVisual(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3.2" />
    </Svg>
  );
}

export function IconAuditory(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M6.5 10a5.5 5.5 0 1 1 11 0c0 2.2-1.3 3-2.4 4-1 .9-1.6 1.7-1.6 3.1a2.4 2.4 0 0 1-4.8 0" />
      <path d="M9.6 9.6a2.6 2.6 0 0 1 4.4 1.6" />
      <path d="M20.4 4.6a9.5 9.5 0 0 1 0 5.6M3.6 4.6a9.5 9.5 0 0 0 0 5.6" />
    </Svg>
  );
}

export function IconTactile(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M9 11.5V5.6a1.6 1.6 0 0 1 3.2 0v5" />
      <path d="M12.2 10.8V9.4a1.6 1.6 0 0 1 3.2 0v1.9" />
      <path d="M15.4 11.6v-.7a1.6 1.6 0 1 1 3.2 0v4.4a5.6 5.6 0 0 1-5.6 5.6h-1a5 5 0 0 1-3.6-1.5l-3-3a1.6 1.6 0 0 1 2.2-2.3L9 15.4" />
      <path d="M4.6 6.2 3.2 4.8M7.4 4.4V2.6M11.4 3.4l.9-1.5" />
    </Svg>
  );
}

export function IconMobility(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="14.6" cy="4.4" r="2" />
      <path d="M9 21.4l2.4-5.2 3.2 2.2.8 3" />
      <path d="M6.4 12.4l3.2-3.6a2.6 2.6 0 0 1 3.4-.4l2.4 1.8 3 .8" />
      <path d="M11.4 16.2 8.2 14l-3.4 3" />
    </Svg>
  );
}

export function IconLanguage(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M20.4 12.4c0 3.8-3.6 6.8-8 6.8a9.6 9.6 0 0 1-2.6-.35L5 21l1.1-3.4a6.3 6.3 0 0 1-2.5-4.9c0-3.8 3.6-6.9 8-6.9s8.8 3 8.8 6.6Z" />
      <path d="M8.8 12.2h.01M12.4 12.2h.01M16 12.2h.01" strokeWidth={2.4} />
    </Svg>
  );
}

export function IconManual(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M7.6 13.4V4.8a1.7 1.7 0 1 1 3.4 0v6.6" />
      <path d="M11 11V3.6a1.7 1.7 0 1 1 3.4 0V11" />
      <path d="M14.4 11.4V6.4a1.7 1.7 0 1 1 3.4 0v8.2a6.6 6.6 0 0 1-6.6 6.6 6.6 6.6 0 0 1-6.6-6.6v-2a1.7 1.7 0 0 1 3.4 0" />
    </Svg>
  );
}

/* ── interface ───────────────────────────────────────────────────────────── */

export function IconCheck(p: IconProps) {
  return (
    <Svg {...p} strokeWidth={2.4}>
      <path d="M4.5 12.5 9.5 17.5 19.5 6.5" />
    </Svg>
  );
}

export function IconClose(p: IconProps) {
  return (
    <Svg {...p} strokeWidth={2.2}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Svg>
  );
}

export function IconMenu(p: IconProps) {
  return (
    <Svg {...p} strokeWidth={2.1}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Svg>
  );
}

export function IconArrowRight(p: IconProps) {
  return (
    <Svg {...p} strokeWidth={2.1}>
      <path d="M4.5 12h14M13 6.5l5.5 5.5-5.5 5.5" />
    </Svg>
  );
}

export function IconArrowLeft(p: IconProps) {
  return (
    <Svg {...p} strokeWidth={2.1}>
      <path d="M19.5 12h-14M11 6.5 5.5 12 11 17.5" />
    </Svg>
  );
}

export function IconChevronRight(p: IconProps) {
  return (
    <Svg {...p} strokeWidth={2.2}>
      <path d="M9 5.5 15.5 12 9 18.5" />
    </Svg>
  );
}

export function IconStar(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="m12 3.4 2.7 5.5 6 .9-4.35 4.24 1.03 6-5.38-2.83-5.38 2.83 1.03-6L3.3 9.8l6-.9L12 3.4Z" />
    </Svg>
  );
}

export function IconStarFilled({ size = 22, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <path d="m12 3.4 2.7 5.5 6 .9-4.35 4.24 1.03 6-5.38-2.83-5.38 2.83 1.03-6L3.3 9.8l6-.9L12 3.4Z" />
    </svg>
  );
}

export function IconSparkle(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 3.2 13.6 8.4 18.8 10 13.6 11.6 12 16.8 10.4 11.6 5.2 10 10.4 8.4 12 3.2Z" />
      <path d="M18.4 16.2l.7 2.1 2.1.7-2.1.7-.7 2.1-.7-2.1-2.1-.7 2.1-.7.7-2.1Z" />
    </Svg>
  );
}

export function IconPlay({ size = 22, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <path d="M8 5.2c0-.8.9-1.3 1.6-.9l9 6.8c.6.4.6 1.4 0 1.8l-9 6.8c-.7.4-1.6-.1-1.6-.9V5.2Z" />
    </svg>
  );
}

export function IconDownload(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 3.5v11m0 0 4-4m-4 4-4-4" />
      <path d="M4.5 16.5v2a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-2" />
    </Svg>
  );
}

export function IconPlus(p: IconProps) {
  return (
    <Svg {...p} strokeWidth={2.3}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  );
}

export function IconCamera(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M3.5 8.6a2 2 0 0 1 2-2h1.7l1-1.7a2 2 0 0 1 1.7-1h4.2a2 2 0 0 1 1.7 1l1 1.7h1.7a2 2 0 0 1 2 2v8.6a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V8.6Z" />
      <circle cx="12" cy="12.6" r="3.4" />
    </Svg>
  );
}

export function IconClock(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M12 7.4V12l3 1.8" />
    </Svg>
  );
}

export function IconShield(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 3.2 19 6v5.4c0 4.2-2.9 7.6-7 9.4-4.1-1.8-7-5.2-7-9.4V6l7-2.8Z" />
      <path d="m9 12 2.2 2.2L15.4 10" />
    </Svg>
  );
}

export function IconHeart(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 20s-7.4-4.3-7.4-9.3A4.1 4.1 0 0 1 12 8.4a4.1 4.1 0 0 1 7.4 2.3C19.4 15.7 12 20 12 20Z" />
    </Svg>
  );
}

export function IconTrophy(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M7.5 4h9v5.2a4.5 4.5 0 0 1-9 0V4Z" />
      <path d="M7.5 5.5H5a2.4 2.4 0 0 0 2.5 4M16.5 5.5H19a2.4 2.4 0 0 1-2.5 4" />
      <path d="M12 13.7V17M9 20.4h6M10 17h4" />
    </Svg>
  );
}

export function IconChart(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4.5 20V9.5M12 20V4.5M19.5 20v-7" />
    </Svg>
  );
}

export function IconUsers(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="9.4" cy="8.2" r="3.4" />
      <path d="M3.4 20a6 6 0 0 1 12 0" />
      <path d="M16.2 5.2a3.4 3.4 0 0 1 0 6.2M17.6 14.6a6 6 0 0 1 3 5.4" />
    </Svg>
  );
}

export function IconLock(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="4.6" y="10.4" width="14.8" height="9.6" rx="2.4" />
      <path d="M8.2 10.4V7.6a3.8 3.8 0 0 1 7.6 0v2.8" />
    </Svg>
  );
}

export function IconBolt(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M13.4 2.6 5 13.4h5.6l-.6 8 8.4-10.8h-5.6l.6-8Z" />
    </Svg>
  );
}

export function IconCalendar(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="3.8" y="5.4" width="16.4" height="15" rx="2.6" />
      <path d="M3.8 10h16.4M8.4 3.4v3.6M15.6 3.4v3.6" />
    </Svg>
  );
}

export function IconPhone(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="7" y="2.5" width="10" height="19" rx="2.4" />
      <path d="M10.3 18.3h3.4" />
    </Svg>
  );
}

export function IconRefresh(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M20 11.6A8 8 0 0 0 6.2 6.8L4 9" />
      <path d="M4 4.4V9h4.6M4 12.4a8 8 0 0 0 13.8 4.8L20 15" />
      <path d="M20 19.6V15h-4.6" />
    </Svg>
  );
}
