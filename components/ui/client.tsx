"use client";

/**
 * The handful of ui/ components that need a hook (state, memo) rather than
 * just props. Split out from primitives.tsx because that file is imported by
 * server-rendered pages too (the marketing homepage among them) — a hook
 * anywhere in a module Next.js has to include in a Server Component's bundle
 * is a build error, even in an export that page never uses.
 */
import { useMemo, useState } from "react";
import { cx } from "./primitives";
import { IconCheck, IconCopy } from "./icons";

/* ══ celebration ═══════════════════════════════════════════════════════════ */

const CONFETTI_COLORS = [
  "var(--brand-500)",
  "var(--sun-400)",
  "var(--sec-tactile)",
  "var(--sec-language)",
  "var(--sec-visual)",
];

export function Confetti({ count = 24 }: { count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: (i * 137.5) % 100,
        delay: (i % 9) * 0.08,
        duration: 1.9 + (i % 6) * 0.24,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        w: 7 + (i % 4) * 3,
      })),
    [count],
  );
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            width: p.w,
            height: p.w * 0.55,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ══ copy to clipboard ═════════════════════════════════════════════════════ */

/** A small "copy" icon button that flips to a checkmark for a beat after use. */
export function CopyButton({
  value,
  label = "Copy",
  size = 15,
  className = "",
}: {
  value: string;
  label?: string;
  size?: number;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      // Clipboard access can be blocked (permissions, insecure context) —
      // there's nothing useful to do but leave the button looking unclicked.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Copied" : label}
      title={copied ? "Copied" : label}
      className={cx(
        "inline-flex size-6 shrink-0 items-center justify-center rounded-md text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink",
        className,
      )}
    >
      {copied ? <IconCheck size={size} style={{ color: "var(--st-on-track)" }} /> : <IconCopy size={size} />}
    </button>
  );
}
