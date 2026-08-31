import { DOMAIN_BY_CODE, DOMAINS } from "@/content/domains";
import type { AssessmentResult, DomainScore } from "@/lib/types";
import { domainColor, statusColor } from "./ui";

/* ────────────────────────────────────────────────────────────────────────────
 * Profile radar
 *
 * Six axes, one per domain, plotted against a highlighted ring at 100 — the
 * level expected for the child's age. The shape relative to that ring is the
 * fastest read in the whole report, and the thing parents remember.
 * ──────────────────────────────────────────────────────────────────────────*/

const MAX = 130;
// Wider than tall: the left and right axis labels sit outside the plot and
// were being clipped by a square viewBox.
const W = 400;
const H = 320;
const CX = W / 2;
const CY = H / 2;
const R = 104;

function point(index: number, value: number): [number, number] {
  const angle = (-90 + index * 60) * (Math.PI / 180);
  const r = (R * Math.min(Math.max(value, 0), MAX)) / MAX;
  return [CX + r * Math.cos(angle), CY + r * Math.sin(angle)];
}

function ring(value: number): string {
  return DOMAINS.map((_, i) => point(i, value).join(",")).join(" ");
}

export function ProfileRadar({ result }: { result: AssessmentResult }) {
  const metric = (d: DomainScore) =>
    d.dq === null ? d.percent * 100 : d.dq;

  const values = DOMAINS.map((d) => {
    const score = result.domainScores.find((s) => s.domain === d.code)!;
    return { domain: d, score, value: metric(score) };
  });

  const shape = values.map((v, i) => point(i, v.value).join(",")).join(" ");

  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mx-auto block h-auto w-full max-w-[400px]"
        role="img"
        aria-label={`Development profile across six areas. ${values
          .map((v) => `${v.domain.name}: ${Math.round(v.value)}`)
          .join(". ")}`}
      >
        {/* background rings */}
        {[32.5, 65, 97.5].map((v) => (
          <polygon
            key={v}
            points={ring(v)}
            fill="none"
            stroke="var(--line)"
            strokeWidth="1"
          />
        ))}

        {/* axes */}
        {DOMAINS.map((d, i) => {
          const [x, y] = point(i, MAX);
          return (
            <line
              key={d.code}
              x1={CX}
              y1={CY}
              x2={x}
              y2={y}
              stroke="var(--line)"
              strokeWidth="1"
            />
          );
        })}

        {/* expected-for-age ring */}
        <polygon
          points={ring(100)}
          fill="none"
          stroke="var(--pine)"
          strokeWidth="1.5"
          strokeDasharray="4 3"
          opacity="0.85"
        />

        {/* the child */}
        <polygon
          points={shape}
          fill="var(--pine)"
          fillOpacity="0.16"
          stroke="var(--pine)"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {values.map((v, i) => {
          const [x, y] = point(i, v.value);
          return (
            <circle
              key={v.domain.code}
              cx={x}
              cy={y}
              r="4.5"
              fill={domainColor(v.domain.code)}
              stroke="var(--surface)"
              strokeWidth="2"
            />
          );
        })}

        {/* axis labels */}
        {DOMAINS.map((d, i) => {
          const angle = (-90 + i * 60) * (Math.PI / 180);
          const lx = CX + (R + 26) * Math.cos(angle);
          const ly = CY + (R + 26) * Math.sin(angle);
          const anchor =
            Math.abs(Math.cos(angle)) < 0.2
              ? "middle"
              : Math.cos(angle) > 0
                ? "start"
                : "end";
          return (
            <text
              key={d.code}
              x={lx}
              y={ly}
              textAnchor={anchor}
              dominantBaseline="middle"
              fontSize="11"
              fontWeight="600"
              fill="var(--ink-2)"
            >
              {d.short}
            </text>
          );
        })}
      </svg>
      <figcaption className="mt-2 flex items-center justify-center gap-2 text-[0.76rem] text-ink-3">
        <svg width="22" height="6" aria-hidden="true">
          <line
            x1="0"
            y1="3"
            x2="22"
            y2="3"
            stroke="var(--pine)"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
        </svg>
        the level we would expect at this age
      </figcaption>
    </figure>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Developmental age against actual age
 *
 * Paired bars per domain. This is the chart a paediatrician will look at.
 * ──────────────────────────────────────────────────────────────────────────*/

export function AgeComparison({ result }: { result: AssessmentResult }) {
  const actual = result.assessedMonths;
  const highest = Math.max(
    actual,
    ...result.domainScores.map((d) => d.developmentalMonths),
  );
  const scale = Math.max(1, Math.ceil((highest * 1.12) / 6) * 6);
  const pct = (m: number) => `${(m / scale) * 100}%`;

  return (
    <div>
      <div className="relative">
        {/* actual-age marker */}
        <div
          className="pointer-events-none absolute inset-y-0 z-10 border-l-2 border-dashed border-[var(--pine)]"
          style={{ left: pct(actual) }}
          aria-hidden="true"
        />

        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {result.domainScores.map((score) => {
            const domain = DOMAIN_BY_CODE[score.domain];
            return (
              <li key={score.domain} className="grid grid-cols-1 gap-1">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[0.82rem] font-semibold text-ink-2">
                    {domain.name}
                  </span>
                  <span className="shrink-0 text-[0.76rem] tabular-nums text-ink-3">
                    {formatMonths(score.developmentalMonths)}
                  </span>
                </div>
                <div className="h-3.5 w-full overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: pct(score.developmentalMonths),
                      background: domainColor(score.domain),
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-3 flex items-center gap-2 text-[0.76rem] text-ink-3">
        <svg width="6" height="14" aria-hidden="true">
          <line
            x1="3"
            y1="0"
            x2="3"
            y2="14"
            stroke="var(--pine)"
            strokeWidth="2"
            strokeDasharray="3 2"
          />
        </svg>
        actual age, {formatMonths(actual)}
        {result.corrected && " (corrected for prematurity)"}
      </div>
    </div>
  );
}

function formatMonths(m: number): string {
  const r = Math.round(m);
  if (r < 24) return `${r} mo`;
  const y = Math.floor(r / 12);
  const rem = r % 12;
  return rem === 0 ? `${y} yr` : `${y} yr ${rem} mo`;
}

/* ── small inline meter used on domain cards ────────────────────────────── */

export function DomainMeter({ score }: { score: DomainScore }) {
  const value = score.dq === null ? score.percent * 100 : score.dq;
  const width = Math.min(100, (value / 120) * 100);
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-surface-2"
      role="img"
      aria-label={`${Math.round(value)} out of an expected 100`}
    >
      <div
        className="h-full rounded-full"
        style={{ width: `${width}%`, background: statusColor(score.status) }}
      />
    </div>
  );
}
