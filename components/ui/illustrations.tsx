import type { CSSProperties } from "react";

/**
 * Custom illustration set.
 *
 * Drawn for this product rather than pulled from a stock library, for two
 * reasons: a bought illustration pack never matches a brand's own palette, and
 * the two diagrams here (the seven brain stages, the six-section wheel) carry
 * real information from the programme — no generic pack contains them.
 */

/* ── mascot: the KGK sun, given a face ───────────────────────────────────── */

export type MascotMood = "happy" | "cheer" | "think" | "wave";

export function Mascot({
  size = 96,
  mood = "happy",
  className = "",
  style,
}: {
  size?: number;
  mood?: MascotMood;
  className?: string;
  style?: CSSProperties;
}) {
  const rays = Array.from({ length: 12 }, (_, i) => i * 30);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      className={className}
      style={style}
      role="img"
      aria-label="Kaushalya sun mascot"
    >
      <defs>
        <radialGradient id="sunFace" cx="38%" cy="32%" r="72%">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="60%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#F59E0B" />
        </radialGradient>
        <linearGradient id="sunRay" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>

      {rays.map((deg) => (
        <rect
          key={deg}
          x="57.5"
          y="2"
          width="5"
          height="15"
          rx="2.5"
          fill="url(#sunRay)"
          transform={`rotate(${deg} 60 60)`}
        />
      ))}

      <circle cx="60" cy="60" r="38" fill="url(#sunFace)" />
      <circle cx="60" cy="60" r="38" fill="none" stroke="#F59E0B" strokeOpacity="0.35" strokeWidth="2" />

      {/* cheeks */}
      <ellipse cx="42" cy="66" rx="6.5" ry="4.5" fill="#FB7185" opacity="0.42" />
      <ellipse cx="78" cy="66" rx="6.5" ry="4.5" fill="#FB7185" opacity="0.42" />

      {/* eyes */}
      {mood === "cheer" ? (
        <>
          <path d="M42 54c2.6-3.4 7.4-3.4 10 0" stroke="#3B2606" strokeWidth="3.4" strokeLinecap="round" fill="none" />
          <path d="M68 54c2.6-3.4 7.4-3.4 10 0" stroke="#3B2606" strokeWidth="3.4" strokeLinecap="round" fill="none" />
        </>
      ) : (
        <>
          <ellipse cx="48" cy="55" rx="4" ry="5" fill="#3B2606" />
          <ellipse cx="72" cy="55" rx="4" ry="5" fill="#3B2606" />
          <circle cx="49.4" cy="53.2" r="1.4" fill="#fff" />
          <circle cx="73.4" cy="53.2" r="1.4" fill="#fff" />
        </>
      )}

      {/* mouth */}
      {mood === "think" ? (
        <path d="M52 72h16" stroke="#3B2606" strokeWidth="3.4" strokeLinecap="round" />
      ) : mood === "cheer" ? (
        <path
          d="M48 68c3 6.5 21 6.5 24 0a12 12 0 0 1-24 0Z"
          fill="#3B2606"
        />
      ) : (
        <path d="M50 69c3.4 4.6 16.6 4.6 20 0" stroke="#3B2606" strokeWidth="3.4" strokeLinecap="round" fill="none" />
      )}

      {mood === "wave" && (
        <g>
          <path
            d="M96 74c4-2 8 1 7 5l-2 8"
            stroke="#F59E0B"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
          />
        </g>
      )}
    </svg>
  );
}

/* ── diagram: the seven stages of brain development ──────────────────────── */

const STAGE_TINT = [
  "#E0455A",
  "#F97316",
  "#FBBF24",
  "#10B981",
  "#0EA5E9",
  "#6366F1",
  "#8B5CF6",
];

/**
 * The programme's seven phases as a climbing path — the same ladder as the
 * printed brain-stage chart, redrawn so a parent can find their child on it.
 *
 * Names are wrapped onto two lines rather than truncated: "Sophisticated
 * Cortex" abbreviated to "Sophisticate…" tells a parent nothing, and this
 * diagram's whole job is to let them locate their child on the ladder.
 */
export function BrainJourney({
  current,
  stages,
  className = "",
}: {
  /** 1-7, the child's current module. */
  current?: number;
  stages: { name: string; ageLabel: string }[];
  className?: string;
}) {
  const W = 900;
  const stepX = 124;
  const baseX = 66;
  const baseY = 196;
  const stepY = 22;
  // Cropped to hug the climb, so the card is not mostly empty sky.
  const viewTop = 26;
  const viewBottom = 292;

  const nodes = stages.slice(0, 7).map((stage, i) => ({
    ...stage,
    x: baseX + i * stepX,
    y: baseY - i * stepY,
    tint: STAGE_TINT[i],
    id: i + 1,
  }));

  const path = nodes
    .map((n, i) => (i === 0 ? `M${n.x} ${n.y}` : `L${n.x} ${n.y}`))
    .join(" ");

  return (
    <svg
      viewBox={`0 ${viewTop} ${W} ${viewBottom - viewTop}`}
      className={className}
      role="img"
      aria-label={`Seven stages of brain development${current ? `, currently stage ${current}` : ""}: ${nodes
        .map((n) => `${n.id} ${n.name} ${n.ageLabel}`)
        .join(", ")}`}
    >
      <defs>
        <linearGradient id="journeyLine" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#E0455A" />
          <stop offset="50%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>

      <path
        d={path}
        fill="none"
        stroke="url(#journeyLine)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray="1 12"
        opacity="0.45"
      />

      {nodes.map((n) => {
        const isCurrent = current === n.id;
        const isPast = current !== undefined && n.id < current;
        const words = n.name.split(" ");
        // Two lines at most: everything but the last word, then the last word.
        const lines =
          words.length > 1 ? [words.slice(0, -1).join(" "), words.at(-1)!] : [n.name];

        return (
          <g key={n.id}>
            {isCurrent && <circle cx={n.x} cy={n.y} r="30" fill={n.tint} opacity="0.16" />}
            <circle
              cx={n.x}
              cy={n.y}
              r={isCurrent ? 21 : 15}
              fill={isCurrent || isPast ? n.tint : "#fff"}
              stroke={n.tint}
              strokeWidth={isCurrent ? 0 : 2.5}
              opacity={isPast && !isCurrent ? 0.6 : 1}
            />
            <text
              x={n.x}
              y={n.y + (isCurrent ? 6 : 5)}
              textAnchor="middle"
              fontSize={isCurrent ? 17 : 13}
              fontWeight="800"
              fill={isCurrent || isPast ? "#fff" : n.tint}
              fontFamily="var(--font-sans)"
            >
              {n.id}
            </text>

            {lines.map((line, li) => (
              <text
                key={line}
                x={n.x}
                y={n.y + 42 + li * 15}
                textAnchor="middle"
                fontSize="13"
                fontWeight={isCurrent ? 800 : 600}
                fill={isCurrent ? "var(--ink)" : "var(--ink-2)"}
                fontFamily="var(--font-sans)"
              >
                {line}
              </text>
            ))}

            <text
              x={n.x}
              y={n.y + 42 + lines.length * 15 + 2}
              textAnchor="middle"
              fontSize="11.5"
              fontWeight="600"
              fill={isCurrent ? n.tint : "var(--ink-3)"}
              fontFamily="var(--font-sans)"
            >
              {n.ageLabel}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ── diagram: the six sections, as a wheel around the child ──────────────── */

export function SectionWheel({
  sections,
  className = "",
}: {
  sections: { label: string; color: string }[];
  className?: string;
}) {
  const cx = 150;
  const cy = 150;
  const r = 104;
  return (
    <svg
      viewBox="0 0 300 300"
      className={className}
      role="img"
      aria-label="Six areas of development around the child"
    >
      <defs>
        <radialGradient id="wheelCore" cx="40%" cy="34%" r="70%">
          <stop offset="0%" stopColor="#EEF1FF" />
          <stop offset="100%" stopColor="#C7CCFF" />
        </radialGradient>
      </defs>

      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--line)" strokeWidth="2" strokeDasharray="4 8" />

      {sections.slice(0, 6).map((s, i) => {
        const angle = (-90 + i * 60) * (Math.PI / 180);
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        return (
          <g key={s.label}>
            <circle cx={x} cy={y} r="26" fill={s.color} opacity="0.14" />
            <circle cx={x} cy={y} r="19" fill={s.color} />
            <text
              x={x}
              y={y + 42}
              textAnchor="middle"
              fontSize="11"
              fontWeight="700"
              fill="var(--ink-2)"
              fontFamily="var(--font-sans)"
            >
              {s.label}
            </text>
          </g>
        );
      })}

      <circle cx={cx} cy={cy} r="46" fill="url(#wheelCore)" />
      <circle cx={cx} cy={cy} r="46" fill="none" stroke="var(--brand-300)" strokeWidth="2" />
      <g transform={`translate(${cx - 26}, ${cy - 28})`}>
        <circle cx="26" cy="18" r="13" fill="var(--brand-600)" />
        <path
          d="M8 46c0-9.4 8-15 18-15s18 5.6 18 15"
          fill="var(--brand-500)"
        />
      </g>
    </svg>
  );
}

/* ── reward: a star badge earned for finishing a section ─────────────────── */

export function StarBadge({
  size = 92,
  color = "var(--sun-400)",
  earned = true,
  className = "",
}: {
  size?: number;
  color?: string;
  earned?: boolean;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label={earned ? "Star earned" : "Star not earned yet"}
    >
      <defs>
        <linearGradient id="badgeGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="100%" stopColor={color} />
        </linearGradient>
      </defs>
      <circle
        cx="50"
        cy="50"
        r="42"
        fill={earned ? "url(#badgeGrad)" : "var(--surface-3)"}
        stroke={earned ? color : "var(--line)"}
        strokeWidth="3"
      />
      <circle cx="50" cy="50" r="34" fill="none" stroke="#fff" strokeOpacity={earned ? 0.5 : 0.2} strokeWidth="2" strokeDasharray="3 6" />
      <path
        d="m50 26 7.2 14.6 16.1 2.3-11.65 11.36 2.75 16.04L50 62.7l-14.4 7.6 2.75-16.04L26.7 42.9l16.1-2.3L50 26Z"
        fill={earned ? "#fff" : "var(--line)"}
        opacity={earned ? 0.95 : 1}
      />
    </svg>
  );
}

/* ── empty state ─────────────────────────────────────────────────────────── */

export function EmptyChildArt({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 170" className={className} role="img" aria-label="No children added yet">
      <ellipse cx="120" cy="146" rx="76" ry="10" fill="var(--surface-3)" />
      <rect x="52" y="52" width="136" height="84" rx="22" fill="var(--surface)" stroke="var(--line)" strokeWidth="2.5" />
      <rect x="52" y="52" width="136" height="26" rx="13" fill="var(--brand-100)" />
      <circle cx="98" cy="104" r="17" fill="var(--brand-200)" />
      <path d="M84 122c0-8 6.4-13 14-13s14 5 14 13" fill="var(--brand-300)" />
      <rect x="126" y="94" width="44" height="7" rx="3.5" fill="var(--surface-3)" />
      <rect x="126" y="108" width="30" height="7" rx="3.5" fill="var(--surface-3)" />
      <g>
        <circle cx="176" cy="44" r="15" fill="var(--sun-300)" />
        <path d="M176 22v-7M176 73v-7M198 44h7M147 44h7M191 29l5-5M156 64l5-5M191 59l5 5M156 24l5 5" stroke="var(--sun-400)" strokeWidth="3" strokeLinecap="round" />
      </g>
    </svg>
  );
}

/* ── decorative blooms behind hero sections ──────────────────────────────── */

/** A single, quiet brand-tinted glow — not a three-colour gradient-mesh
 * background. One restrained signal reads as designed; three pastel blobs
 * read as a template. */
export function Blooms() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <span
        className="bloom"
        style={{ width: 420, height: 420, top: -200, left: -140, opacity: 0.28, "--bloom-color": "#C7CCFF" } as CSSProperties}
      />
    </div>
  );
}
