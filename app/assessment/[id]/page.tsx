"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DOMAINS, DOMAIN_BY_CODE, moduleForAge } from "@/content/domains";
import { itemsForModule } from "@/content/items";
import { summariseAge } from "@/lib/age";
import {
  completeAssessment,
  getAssessment,
  saveResponse,
  type StoredAssessment,
} from "@/lib/store";
import type { DomainCode, Item, ResponseValue } from "@/lib/types";
import {
  Avatar,
  Button,
  Card,
  IconArrowLeft,
  IconArrowRight,
  IconBolt,
  IconCheck,
  IconClock,
  IconSparkle,
  IconStarFilled,
  Mascot,
  ProgressRing,
  SectionTile,
  Shell,
  StarBadge,
  TopBar,
  domainColor,
} from "@/components/ui";

/* ── reward economy ──────────────────────────────────────────────────────────
 * Small, frequent, honest. Ten points for every answer so progress is visible
 * on every tap; fifty for closing a section, so the six section endings feel
 * like arrivals rather than just more scrolling.
 *
 * Nothing here scores the child. It scores the parent's progress through the
 * check, and the copy is careful to keep that distinction — a reward for
 * answering "not yet" has to feel exactly as good as one for "yes", or the
 * whole instrument quietly biases upward.
 * ────────────────────────────────────────────────────────────────────────── */
const XP_PER_ANSWER = 10;
const XP_PER_SECTION = 50;
const SECONDS_PER_QUESTION = 8;

const ANSWERS: {
  value: ResponseValue;
  label: string;
  hint: string;
  tone: string;
  glyph: React.ReactNode;
}[] = [
  {
    value: 2,
    label: "Yes, they do this",
    hint: "Confidently, most times",
    tone: "var(--st-on-track)",
    glyph: <IconCheck size={20} />,
  },
  {
    value: 1,
    label: "Sometimes",
    hint: "Starting to, but not every time",
    tone: "var(--st-emerging)",
    glyph: <HalfGlyph />,
  },
  {
    value: 0,
    label: "Not yet",
    hint: "This one is still on the way",
    tone: "var(--ink-3)",
    glyph: <DotGlyph />,
  },
];

interface Section {
  domain: DomainCode;
  items: Item[];
}

type Phase = "intro" | "question" | "sectionDone" | "finish" | "celebrating";

export default function AssessmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [record, setRecord] = useState<StoredAssessment | null | undefined>(undefined);
  const [responses, setResponses] = useState<Record<string, ResponseValue>>({});
  const [sectionIndex, setSectionIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("intro");
  const [reward, setReward] = useState<{ key: number; amount: number } | null>(null);
  const [pending, setPending] = useState(false);
  const [resumed, setResumed] = useState(false);

  useEffect(() => {
    const found = getAssessment(id);
    setRecord(found);
    if (found) setResponses(found.responses);
  }, [id]);

  const sections: Section[] = useMemo(() => {
    if (!record) return [];
    const moduleId = moduleForAge(monthsFor(record)).id;
    return DOMAINS.map((d) => ({ domain: d.code, items: itemsForModule(moduleId, d.code) }));
  }, [record]);

  /* Resume exactly where the parent stopped — the single biggest reason a
     long form gets abandoned is being made to find your place again. */
  useEffect(() => {
    if (resumed || sections.length === 0 || !record) return;
    if (Object.keys(record.responses).length > 0) {
      outer: for (let s = 0; s < sections.length; s++) {
        for (let q = 0; q < sections[s].items.length; q++) {
          if (record.responses[sections[s].items[q].id] === undefined) {
            setSectionIndex(s);
            setQuestionIndex(q);
            setPhase("question");
            break outer;
          }
        }
      }
    }
    setResumed(true);
  }, [sections, record, resumed]);

  const allItems = useMemo(() => sections.flatMap((s) => s.items), [sections]);
  const answeredCount = allItems.filter((i) => responses[i.id] !== undefined).length;
  const total = allItems.length;
  const pct = total === 0 ? 0 : (answeredCount / total) * 100;
  const xp =
    answeredCount * XP_PER_ANSWER + completedSections(sections, responses) * XP_PER_SECTION;
  const minutesLeft = Math.max(
    1,
    Math.round(((total - answeredCount) * SECONDS_PER_QUESTION) / 60),
  );

  const answer = useCallback(
    (item: Item, value: ResponseValue) => {
      if (pending) return;
      const isNew = responses[item.id] === undefined;
      setResponses((prev) => ({ ...prev, [item.id]: value }));
      saveResponse(id, item.id, value);
      if (isNew) setReward({ key: Date.now(), amount: XP_PER_ANSWER });
      setPending(true);

      // A beat of feedback, then move on by itself. The parent never hunts for
      // a "next" button — that hunt is what makes seventy questions feel long.
      window.setTimeout(() => {
        setPending(false);
        setQuestionIndex((qi) => {
          const section = sections[sectionIndex];
          if (!section) return qi;
          if (qi + 1 < section.items.length) return qi + 1;
          setPhase(sectionIndex + 1 < sections.length ? "sectionDone" : "finish");
          return qi;
        });
      }, 420);
    },
    [id, pending, responses, sectionIndex, sections],
  );

  if (record === undefined) return <Loading />;
  if (record === null) return <NotFound onStart={() => router.push("/children")} />;

  const childAge = summariseAge(
    record.child.dob,
    record.assessedOn,
    record.child.gestationalWeeks,
  );
  const currentModule = moduleForAge(childAge.assessedMonths);
  const section = sections[sectionIndex];
  const domain = section ? DOMAIN_BY_CODE[section.domain] : null;
  const item = section?.items[questionIndex];

  function goBack() {
    if (phase !== "question") {
      setPhase("question");
      return;
    }
    if (questionIndex > 0) {
      setQuestionIndex((q) => q - 1);
      return;
    }
    if (sectionIndex > 0) {
      const prev = sectionIndex - 1;
      setSectionIndex(prev);
      setQuestionIndex(Math.max(0, sections[prev].items.length - 1));
    }
  }

  function nextSection() {
    const next = sectionIndex + 1;
    if (next < sections.length) {
      setSectionIndex(next);
      setQuestionIndex(0);
      setPhase("intro");
      window.scrollTo({ top: 0, behavior: "instant" });
    } else {
      setPhase("finish");
    }
  }

  function finish() {
    completeAssessment(id);
    setPhase("celebrating");
    window.setTimeout(() => router.push(`/report/${id}`), 1900);
  }

  if (phase === "celebrating") {
    return <Celebration name={record.child.name} xp={xp} />;
  }

  return (
    <>
      {/* ── the HUD: progress, section pips, XP, the child themselves ───── */}
      <header
        className="no-print sticky top-0 z-40 border-b border-line backdrop-blur-xl"
        style={{ background: "color-mix(in srgb, var(--ground) 88%, transparent)" }}
      >
        <Shell width="wide">
          <div className="flex items-center gap-3 py-3 sm:gap-4">
            <button
              type="button"
              onClick={goBack}
              disabled={sectionIndex === 0 && questionIndex === 0 && phase === "question"}
              aria-label="Previous question"
              className="btn btn-ghost !min-h-11 !px-3 disabled:opacity-30"
            >
              <IconArrowLeft size={20} />
            </button>

            <div className="min-w-0 flex-1">
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-1.5 flex items-center gap-1.5">
                {sections.map((s, i) => (
                  <span
                    key={s.domain}
                    className="step-dot flex-1"
                    data-state={
                      i < sectionIndex ? "done" : i === sectionIndex ? "current" : "todo"
                    }
                    aria-hidden="true"
                  />
                ))}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <span
                className="chip"
                style={
                  {
                    "--chip-bg": "var(--sun-100)",
                    "--chip-fg": "var(--sun-700)",
                    "--chip-bd": "transparent",
                  } as React.CSSProperties
                }
              >
                <IconBolt size={14} />
                <span className="tnum">{xp}</span>
              </span>
              <Avatar
                name={record.child.name}
                photoUrl={record.child.photoUrl}
                size={38}
                ring
              />
            </div>
          </div>
        </Shell>
      </header>

      {/* On a large screen the card is far shorter than the viewport, so it is
          optically centred rather than pinned to the top with dead space below.
          min-height (not height) means the container still grows for long
          content, so nothing can ever be pushed out of reach. */}
      <main className="pb-36 pt-6 sm:pt-10 lg:flex lg:min-h-[calc(100dvh-6.5rem)] lg:items-center lg:pb-28 lg:pt-4">
        <Shell width="narrow" className="lg:w-full">
          {phase === "intro" && section && domain && (
            <SectionIntro
              index={sectionIndex}
              total={sections.length}
              code={section.domain}
              name={domain.name}
              blurb={domain.blurb.replace("your child", record.child.name)}
              questionCount={section.items.length}
              moduleLabel={`Module ${currentModule.id} · ${currentModule.name}`}
              onStart={() => setPhase("question")}
            />
          )}

          {phase === "question" && section && domain && item && (
            <QuestionView
              key={item.id}
              item={item}
              code={section.domain}
              sectionName={domain.name}
              index={questionIndex}
              sectionTotal={section.items.length}
              value={responses[item.id]}
              minutesLeft={minutesLeft}
              disabled={pending}
              onAnswer={(v) => answer(item, v)}
            />
          )}

          {phase === "sectionDone" && section && domain && (
            <SectionComplete
              name={domain.name}
              code={section.domain}
              childName={record.child.name}
              starsEarned={sectionIndex + 1}
              starsTotal={sections.length}
              xp={xp}
              nextName={
                sections[sectionIndex + 1]
                  ? DOMAIN_BY_CODE[sections[sectionIndex + 1].domain].name
                  : undefined
              }
              onContinue={nextSection}
            />
          )}

          {phase === "finish" && (
            <FinishView
              childName={record.child.name}
              xp={xp}
              stars={completedSections(sections, responses)}
              total={total}
              answered={answeredCount}
              unanswered={allItems.filter((i) => responses[i.id] === undefined)}
              onFinish={finish}
              onJumpTo={(itemId) => {
                for (let s = 0; s < sections.length; s++) {
                  const q = sections[s].items.findIndex((i) => i.id === itemId);
                  if (q >= 0) {
                    setSectionIndex(s);
                    setQuestionIndex(q);
                    setPhase("question");
                    window.scrollTo({ top: 0, behavior: "instant" });
                    return;
                  }
                }
              }}
            />
          )}
        </Shell>
      </main>

      {reward && (
        <span
          key={reward.key}
          className="animate-float-up pointer-events-none fixed left-1/2 top-[44%] z-50 -translate-x-1/2 text-[1.7rem] font-extrabold"
          style={{ fontFamily: "var(--font-display)", color: "var(--sun-500)" }}
          onAnimationEnd={() => setReward(null)}
        >
          +{reward.amount} XP
        </span>
      )}
    </>
  );
}

/* ══ section intro ═════════════════════════════════════════════════════════ */

function SectionIntro({
  index,
  total,
  code,
  name,
  blurb,
  questionCount,
  moduleLabel,
  onStart,
}: {
  index: number;
  total: number;
  code: DomainCode;
  name: string;
  blurb: string;
  questionCount: number;
  moduleLabel: string;
  onStart: () => void;
}) {
  return (
    <div className="animate-rise pt-6 text-center">
      <p className="eyebrow justify-center">
        Section {index + 1} of {total} · {moduleLabel}
      </p>

      <div className="animate-pop mt-7 flex justify-center">
        <SectionTile code={code} size={104} />
      </div>

      <h1 className="mt-6">{name}</h1>
      <p className="lede mx-auto mt-3 max-w-[40ch]">{blurb}</p>

      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <span className="chip chip-lg">
          <IconSparkle size={15} /> {questionCount} questions
        </span>
        <span className="chip chip-lg">
          <IconClock size={15} /> ~
          {Math.max(1, Math.round((questionCount * SECONDS_PER_QUESTION) / 60))} min
        </span>
      </div>

      <Button size="lg" className="mt-9" onClick={onStart} iconRight={<IconArrowRight size={18} />}>
        Let&rsquo;s go
      </Button>

      <p className="mt-6 text-[0.86rem] text-ink-3">
        Answer for what they do <em>now</em> — &ldquo;not yet&rdquo; is a useful answer.
      </p>
    </div>
  );
}

/* ══ one question, one screen ══════════════════════════════════════════════ */

function QuestionView({
  item,
  code,
  sectionName,
  index,
  sectionTotal,
  value,
  minutesLeft,
  disabled,
  onAnswer,
}: {
  item: Item;
  code: DomainCode;
  sectionName: string;
  index: number;
  sectionTotal: number;
  value: ResponseValue | undefined;
  minutesLeft: number;
  disabled: boolean;
  onAnswer: (v: ResponseValue) => void;
}) {
  const color = domainColor(code);
  return (
    <div className="animate-slide-in">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2.5">
          <SectionTile code={code} size={38} />
          <span className="text-[0.88rem] font-extrabold" style={{ color }}>
            {sectionName}
          </span>
        </span>
        <span className="flex items-center gap-3">
          <span className="text-[0.82rem] font-bold text-ink-3">
            <span className="tnum">{index + 1}</span> of {sectionTotal}
          </span>
          <ProgressRing
            value={((index + 1) / sectionTotal) * 100}
            size={40}
            stroke={5}
            color={color}
          >
            <span className="tnum text-[0.62rem] font-extrabold text-ink-3">
              {sectionTotal - index - 1}
            </span>
          </ProgressRing>
        </span>
      </div>

      <Card variant="clay" className="clay-lg mt-6 p-6 sm:p-8">
        <h2 className="text-[1.32rem] leading-snug sm:text-[1.55rem]">{item.text}</h2>

        <div
          className="mt-5 flex gap-3 rounded-[var(--radius)] p-4"
          style={{ background: `color-mix(in srgb, ${color} 8%, var(--surface-2))` }}
        >
          <span className="mt-0.5 shrink-0" style={{ color }}>
            <IconSparkle size={18} />
          </span>
          <p className="text-[0.9rem] leading-relaxed text-ink-2">
            <strong className="font-bold text-ink">Try it: </strong>
            {item.how}
          </p>
        </div>
      </Card>

      <div className="mt-5 space-y-3" role="radiogroup" aria-label={item.text}>
        {ANSWERS.map((a) => (
          <button
            key={a.value}
            type="button"
            role="radio"
            aria-checked={value === a.value}
            disabled={disabled}
            data-selected={value === a.value}
            onClick={() => onAnswer(a.value)}
            className="answer"
            style={{ "--tone": a.tone } as React.CSSProperties}
          >
            <span className="answer-key">{a.glyph}</span>
            <span className="min-w-0">
              <span className="block">{a.label}</span>
              <span className="block text-[0.8rem] font-medium text-ink-3">{a.hint}</span>
            </span>
          </button>
        ))}
      </div>

      <p className="mt-7 flex items-center justify-center gap-2 text-[0.83rem] font-semibold text-ink-3">
        <IconClock size={15} />
        About {minutesLeft} min left · your answers save as you go
      </p>
    </div>
  );
}

/* ══ section complete: the reward beat ═════════════════════════════════════ */

const CHEERS = [
  "Brilliant work!",
  "Another one done!",
  "You're flying through this.",
  "Halfway and going strong.",
  "Almost there now!",
  "Last section done!",
];

function SectionComplete({
  name,
  code,
  childName,
  starsEarned,
  starsTotal,
  xp,
  nextName,
  onContinue,
}: {
  name: string;
  code: DomainCode;
  childName: string;
  starsEarned: number;
  starsTotal: number;
  xp: number;
  nextName?: string;
  onContinue: () => void;
}) {
  const color = domainColor(code);
  return (
    <div className="relative pt-4 text-center">
      <Confetti count={22} />

      <div className="celebrate-ring mx-auto w-fit">
        <StarBadge size={116} color={color} />
      </div>

      <p className="eyebrow eyebrow-accent mt-6 justify-center">Section complete</p>
      <h1 className="mt-3">{CHEERS[(starsEarned - 1) % CHEERS.length]}</h1>
      <p className="lede mx-auto mt-3 max-w-[42ch]">
        {name} is done for {childName} — that&rsquo;s{" "}
        <strong className="whitespace-nowrap font-bold text-ink">
          +{XP_PER_SECTION} XP
        </strong>{" "}
        and a new star.
      </p>

      <div className="mt-7 flex items-center justify-center gap-2.5">
        {Array.from({ length: starsTotal }, (_, i) => (
          <span
            key={i}
            className={i < starsEarned ? "animate-pop" : ""}
            style={{
              animationDelay: `${i * 70}ms`,
              color: i < starsEarned ? "var(--sun-400)" : "var(--surface-3)",
            }}
          >
            <IconStarFilled size={30} />
          </span>
        ))}
      </div>

      <Card
        variant="clay"
        className="mx-auto mt-8 flex max-w-[22rem] items-center justify-around gap-4 px-5 py-4"
      >
        <div className="text-center">
          <p
            className="tnum text-[1.5rem] font-extrabold text-ink"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {xp}
          </p>
          <p className="text-[0.76rem] font-bold text-ink-3">Total XP</p>
        </div>
        <span className="h-10 w-px bg-line" />
        <div className="text-center">
          <p
            className="tnum text-[1.5rem] font-extrabold text-ink"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {starsEarned}/{starsTotal}
          </p>
          <p className="text-[0.76rem] font-bold text-ink-3">Sections</p>
        </div>
      </Card>

      <Button size="lg" className="mt-8" onClick={onContinue} iconRight={<IconArrowRight size={18} />}>
        {nextName ? `Next: ${nextName}` : "Finish up"}
      </Button>
    </div>
  );
}

/* ══ finish ════════════════════════════════════════════════════════════════ */

function FinishView({
  childName,
  xp,
  stars,
  total,
  answered,
  unanswered,
  onFinish,
  onJumpTo,
}: {
  childName: string;
  xp: number;
  stars: number;
  total: number;
  answered: number;
  unanswered: Item[];
  onFinish: () => void;
  onJumpTo: (itemId: string) => void;
}) {
  const complete = unanswered.length === 0;
  return (
    <div className="relative pt-4 text-center">
      {complete && <Confetti count={30} />}

      <Mascot size={112} mood="cheer" className="animate-bob mx-auto" />

      <h1 className="mt-6">
        {complete ? "All six sections done!" : `${unanswered.length} still to answer`}
      </h1>
      <p className="lede mx-auto mt-3 max-w-[42ch]">
        {complete
          ? `You answered all ${total} questions about ${childName}. Submit to build their report.`
          : "You can submit without these — we leave them out rather than counting them as a no."}
      </p>

      <div className="mx-auto mt-8 grid max-w-[26rem] grid-cols-3 gap-3">
        {[
          { value: String(xp), label: "XP earned", color: "var(--sun-500)" },
          { value: `${stars}/6`, label: "Stars", color: "var(--accent)" },
          { value: `${answered}/${total}`, label: "Answered", color: "var(--st-on-track)" },
        ].map((s) => (
          <Card key={s.label} variant="clay" className="px-3 py-4">
            <p
              className="tnum text-[1.28rem] font-extrabold"
              style={{ fontFamily: "var(--font-display)", color: s.color }}
            >
              {s.value}
            </p>
            <p className="mt-1 text-[0.72rem] font-bold text-ink-3">{s.label}</p>
          </Card>
        ))}
      </div>

      {!complete && (
        <ul className="mx-auto mt-7 max-w-[30rem] list-none space-y-2 p-0 text-left">
          {unanswered.slice(0, 6).map((i) => (
            <li key={i.id}>
              <button
                type="button"
                onClick={() => onJumpTo(i.id)}
                className="card clay-press w-full p-3.5 text-left"
              >
                <span className="text-[0.9rem] font-semibold text-ink-2">{i.text}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="action-bar">
        <Shell width="narrow">
          <Button size="lg" block onClick={onFinish} iconRight={<IconArrowRight size={18} />}>
            Submit assessment
          </Button>
        </Shell>
      </div>
    </div>
  );
}

/* ══ celebration ═══════════════════════════════════════════════════════════ */

function Celebration({ name, xp }: { name: string; xp: number }) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-hidden px-6 text-center"
      style={{ background: "var(--ground)" }}
      role="status"
      aria-live="polite"
    >
      <Confetti count={44} />
      <div>
        <span
          className="celebrate-ring mx-auto grid size-32 place-items-center rounded-full"
          style={{ background: "var(--st-on-track-soft)", color: "var(--st-on-track)" }}
        >
          <IconCheck size={64} />
        </span>
        <h1 className="animate-rise mt-8" style={{ animationDelay: "160ms" }}>
          Amazing work!
        </h1>
        <p className="lede animate-rise mt-3" style={{ animationDelay: "240ms" }}>
          {name}&rsquo;s report is ready — {xp} XP earned.
        </p>
      </div>
    </div>
  );
}

const CONFETTI_COLORS = [
  "var(--brand-500)",
  "var(--sun-400)",
  "var(--sec-tactile)",
  "var(--sec-language)",
  "var(--sec-visual)",
];

function Confetti({ count = 24 }: { count?: number }) {
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

/* ══ states ════════════════════════════════════════════════════════════════ */

function Loading() {
  return (
    <>
      <TopBar nav={false} />
      <Shell>
        <p className="pt-24 text-center text-[0.95rem] font-semibold text-ink-3">Loading…</p>
      </Shell>
    </>
  );
}

function NotFound({ onStart }: { onStart: () => void }) {
  return (
    <>
      <TopBar nav={false} />
      <Shell width="narrow">
        <div className="pt-20 text-center">
          <Mascot size={92} mood="think" className="mx-auto" />
          <h1 className="mt-6">We couldn&rsquo;t find that check</h1>
          <p className="prose-read mx-auto mt-3 max-w-[42ch]">
            Assessments are saved in this browser only, so a link from another device
            won&rsquo;t open here.
          </p>
          <Button className="mt-8" onClick={onStart}>
            Go to your children
          </Button>
        </div>
      </Shell>
    </>
  );
}

/* ══ helpers ═══════════════════════════════════════════════════════════════ */

function monthsFor(record: StoredAssessment): number {
  return summariseAge(record.child.dob, record.assessedOn, record.child.gestationalWeeks)
    .assessedMonths;
}

function completedSections(
  sections: Section[],
  responses: Record<string, ResponseValue>,
): number {
  return sections.filter(
    (s) => s.items.length > 0 && s.items.every((i) => responses[i.id] !== undefined),
  ).length;
}

function HalfGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M12 3.5a8.5 8.5 0 0 1 0 17V3.5Z" fill="currentColor" />
    </svg>
  );
}

function DotGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="2.6" fill="currentColor" />
    </svg>
  );
}
