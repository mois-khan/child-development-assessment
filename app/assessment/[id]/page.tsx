"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DOMAINS, DOMAIN_BY_CODE } from "@/content/domains";
import { STAGE_BY_ID } from "@/content/stages";
import { liveItemsFor } from "@/lib/admin/content";
import { summariseAge } from "@/lib/age";
import { cellComplete, nextStageFor, startStageFor } from "@/lib/scoring";
import {
  appendStage,
  completeAssessment,
  getAssessment,
  saveDetail,
  saveResponse,
  type StoredAssessment,
} from "@/lib/store";
import type { BrainStage, DomainCode, Item, ResponseValue } from "@/lib/types";
import {
  Avatar,
  Button,
  Card,
  IconArrowLeft,
  IconArrowRight,
  IconBolt,
  IconCheck,
  IconClock,
  IconClose,
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

/* ── how this screen works ───────────────────────────────────────────────────
 * One competence at a time, and within it one stage of the chart at a time.
 *
 * The parent is never shown a fixed list of questions, because there isn't
 * one. Each section opens on the stage the child's age points at. When every
 * scored question in that stage has an answer, the engine decides where to go
 * next — up if the child has it, down if they do not — and the new questions
 * are appended to the section the parent is already in. The section ends when
 * the walk settles.
 *
 * Two consequences the UI has to be honest about:
 *   - the total number of questions is not knowable at the start, so progress
 *     is shown against the six sections, which IS fixed, and never as a
 *     countdown to a number we would have to invent
 *   - questions appearing after what looked like the end reads as a bug unless
 *     it is explained, so every move up or down gets its own screen saying
 *     what just happened and why
 * ────────────────────────────────────────────────────────────────────────── */

/* ── reward economy ──────────────────────────────────────────────────────────
 * Small, frequent, honest. Ten points for every answer so progress is visible
 * on every tap; fifty for closing a section, so the six section endings feel
 * like arrivals rather than just more scrolling.
 *
 * Nothing here scores the child. It scores the parent's progress through the
 * check, and the copy is careful to keep that distinction — a reward for
 * answering "no" has to feel exactly as good as one for "yes", or the whole
 * instrument quietly biases upward.
 * ────────────────────────────────────────────────────────────────────────── */
const XP_PER_ANSWER = 10;
const XP_PER_SECTION = 50;
const SECONDS_PER_QUESTION = 8;

/**
 * The booklet is yes or no. There is deliberately no middle option: a stage is
 * something a child has reached or has not, and offering "sometimes" would let
 * an unsure parent avoid the decision on every question, which biases the
 * whole profile upward. The hints below give them somewhere to put the doubt.
 */
const ANSWERS: {
  value: ResponseValue;
  label: string;
  hint: string;
  tone: string;
  glyph: React.ReactNode;
}[] = [
  {
    value: 1,
    label: "Yes",
    hint: "They do this, most times you try",
    tone: "var(--st-on-track)",
    glyph: <IconCheck size={20} />,
  },
  {
    value: 0,
    label: "No",
    hint: "Not yet, or only now and then",
    tone: "var(--ink-3)",
    glyph: <DotGlyph />,
  },
];

type Phase =
  | "intro"
  | "question"
  | "stageUp"
  | "stageDown"
  | "sectionDone"
  | "finish"
  | "celebrating";

const DOMAIN_ORDER: DomainCode[] = DOMAINS.map((d) => d.code);

export default function AssessmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [record, setRecord] = useState<StoredAssessment | null | undefined>(undefined);
  const [responses, setResponses] = useState<Record<string, ResponseValue>>({});
  const [details, setDetails] = useState<Record<string, string>>({});
  /** Stages asked so far per competence, in the order the walk asked them. */
  const [stages, setStages] = useState<Record<DomainCode, string[]>>(
    {} as Record<DomainCode, string[]>,
  );
  const [sectionIndex, setSectionIndex] = useState(0);
  /** Which of this section's stages we are on — an index into stages[domain]. */
  const [stageOrdinal, setStageOrdinal] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("intro");
  const [reward, setReward] = useState<{ key: number; amount: number } | null>(null);
  const [pending, setPending] = useState(false);
  const [resumed, setResumed] = useState(false);

  useEffect(() => {
    let active = true;
    getAssessment(id).then(found => {
      if (!active) return;
      setRecord(found);
      if (found) {
        setResponses(found.responses);
        setDetails(found.details ?? {});
        setStages(found.stagesByDomain);
      }
    });
    return () => { active = false; };
  }, [id]);

  const months = record ? monthsFor(record) : 0;

  /** Every question for one cell of the chart, admin edits included. */
  const itemsAt = useCallback(
    (domain: DomainCode, stage: string | undefined): Item[] =>
      stage ? liveItemsFor(stage, domain, months) : [],
    [months],
  );

  /* Resume exactly where the parent stopped — the single biggest reason a long
     form gets abandoned is being made to find your place again.

     This also repairs the walk. If the tab was closed between the last answer
     of a stage and the engine opening the next one, the stored stage list is
     one short; replaying nextStageFor here brings it back to what it would
     have been, so a reload can never change the path the assessment took. */
  useEffect(() => {
    if (resumed || !record || Object.keys(stages).length === 0) return;

    const repaired: Record<DomainCode, string[]> = { ...stages };
    for (const domain of DOMAIN_ORDER) {
      let list = repaired[domain] ?? [];
      for (let guard = 0; guard < 8; guard++) {
        const top = list[list.length - 1];
        if (!top || !cellComplete(top, domain, record.responses, months)) break;
        const next = nextStageFor(domain, list, record.responses, months);
        if (!next) break;
        appendStage(id, domain, next.id);
        list = [...list, next.id];
      }
      repaired[domain] = list;
    }
    setStages(repaired);

    if (Object.keys(record.responses).length > 0) {
      outer: for (let s = 0; s < DOMAIN_ORDER.length; s++) {
        const domain = DOMAIN_ORDER[s];
        const list = repaired[domain] ?? [];
        for (let st = 0; st < list.length; st++) {
          const items = itemsAt(domain, list[st]);
          for (let q = 0; q < items.length; q++) {
            const item = items[q];
            const done =
              item.kind === "yesno"
                ? record.responses[item.id] !== undefined
                : (record.details ?? {})[item.id] !== undefined;
            if (!done) {
              setSectionIndex(s);
              setStageOrdinal(st);
              setQuestionIndex(q);
              setPhase("question");
              break outer;
            }
          }
        }
      }
    }
    setResumed(true);
  }, [record, stages, resumed, id, months, itemsAt]);

  const domainCode = DOMAIN_ORDER[sectionIndex];
  const stageIds = useMemo(() => stages[domainCode] ?? [], [stages, domainCode]);
  const stageId = stageIds[stageOrdinal];
  const stage = stageId ? STAGE_BY_ID[stageId] : undefined;
  const items = useMemo(
    () => itemsAt(domainCode, stageId),
    [itemsAt, domainCode, stageId],
  );
  const item = items[questionIndex];

  const answeredCount =
    Object.keys(responses).length + Object.keys(details).length;
  const sectionsDone = DOMAIN_ORDER.filter((d, i) => i < sectionIndex).length;
  const xp = answeredCount * XP_PER_ANSWER + sectionsDone * XP_PER_SECTION;

  /* Progress is measured against the six sections, which is the one thing
     about the length that is fixed. Counting questions would mean showing a
     denominator that grows as the walk extends, which reads as the finish line
     moving away. */
  const withinSection = items.length === 0 ? 0 : (questionIndex + 1) / items.length;
  const pct = ((sectionIndex + withinSection) / DOMAIN_ORDER.length) * 100;
  const minutesLeft = Math.max(
    1,
    Math.round(
      ((DOMAIN_ORDER.length - sectionIndex - withinSection) * 5 * SECONDS_PER_QUESTION) /
        60,
    ),
  );

  /** Move on from a finished stage: climb, descend, or close the section. */
  const advanceStage = useCallback(
    (nextResponses: Record<string, ResponseValue>) => {
      const next = nextStageFor(domainCode, stageIds, nextResponses, months);
      if (!next) {
        setPhase(sectionIndex + 1 < DOMAIN_ORDER.length ? "sectionDone" : "finish");
        return;
      }
      appendStage(id, domainCode, next.id);
      setStages((prev) => ({
        ...prev,
        [domainCode]: [...(prev[domainCode] ?? []), next.id],
      }));
      const climbing = !!stage && next.order > stage.order;
      setPhase(climbing ? "stageUp" : "stageDown");
    },
    [domainCode, stageIds, months, id, sectionIndex, stage],
  );

  const answer = useCallback(
    (target: Item, value: ResponseValue) => {
      if (pending) return;
      const isNew = responses[target.id] === undefined;
      const next = { ...responses, [target.id]: value };
      setResponses(next);
      saveResponse(id, target.id, value);
      if (isNew) setReward({ key: Date.now(), amount: XP_PER_ANSWER });
      setPending(true);

      // A beat of feedback, then move on by itself. The parent never hunts for
      // a "next" button — that hunt is what makes a long form feel long.
      window.setTimeout(() => {
        setPending(false);
        if (questionIndex + 1 < items.length) {
          setQuestionIndex(questionIndex + 1);
        } else {
          advanceStage(next);
        }
      }, 420);
    },
    [id, pending, responses, questionIndex, items.length, advanceStage],
  );

  /** A count, a percentage, which hand — recorded, never scored. */
  const observe = useCallback(
    (target: Item, value: string) => {
      setDetails((prev) => ({ ...prev, [target.id]: value }));
      saveDetail(id, target.id, value);
    },
    [id],
  );

  const skipObservation = useCallback(() => {
    if (questionIndex + 1 < items.length) setQuestionIndex(questionIndex + 1);
    else advanceStage(responses);
  }, [questionIndex, items.length, advanceStage, responses]);

  if (record === undefined) return <Loading />;
  if (record === null) return <NotFound onStart={() => router.push("/children")} />;

  const domain = DOMAIN_BY_CODE[domainCode];
  const startStage = startStageFor(months);

  function goBack() {
    if (phase !== "question") {
      setPhase("question");
      return;
    }
    if (questionIndex > 0) {
      setQuestionIndex((q) => q - 1);
      return;
    }
    if (stageOrdinal > 0) {
      const prev = stageOrdinal - 1;
      setStageOrdinal(prev);
      setQuestionIndex(Math.max(0, itemsAt(domainCode, stageIds[prev]).length - 1));
      return;
    }
    if (sectionIndex > 0) {
      const s = sectionIndex - 1;
      const prevDomain = DOMAIN_ORDER[s];
      const prevStages = stages[prevDomain] ?? [];
      const last = Math.max(0, prevStages.length - 1);
      setSectionIndex(s);
      setStageOrdinal(last);
      setQuestionIndex(
        Math.max(0, itemsAt(prevDomain, prevStages[last]).length - 1),
      );
    }
  }

  /** Continue into the stage the walk just opened, in the same section. */
  function continueStage() {
    setStageOrdinal((o) => o + 1);
    setQuestionIndex(0);
    setPhase("question");
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  function nextSection() {
    const next = sectionIndex + 1;
    if (next < DOMAIN_ORDER.length) {
      setSectionIndex(next);
      setStageOrdinal(0);
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

  const pendingStage = stageIds[stageOrdinal + 1]
    ? STAGE_BY_ID[stageIds[stageOrdinal + 1]]
    : undefined;

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
              disabled={
                sectionIndex === 0 &&
                stageOrdinal === 0 &&
                questionIndex === 0 &&
                phase === "question"
              }
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
                {DOMAIN_ORDER.map((code, i) => (
                  <span
                    key={code}
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
              {/* Every answer saves as it's given (saveResponse/saveDetail),
                  so leaving mid-check loses nothing — but nothing else in this
                  full-screen flow says that or offers a way out beyond the
                  browser's own back button, which isn't obvious inside what
                  looks like a native app screen. */}
              <button
                type="button"
                onClick={() => router.push(`/children/${record.child.id}`)}
                aria-label={`Save and exit ${record.child.name}'s check`}
                title="Your answers are saved — come back any time"
                className="btn btn-ghost !min-h-11 !min-w-11 !px-0"
              >
                <IconClose size={18} />
              </button>
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
          {phase === "intro" && stage && (
            <SectionIntro
              index={sectionIndex}
              total={DOMAIN_ORDER.length}
              code={domainCode}
              name={domain.name}
              blurb={domain.blurb.replace("your child", record.child.name)}
              questionCount={items.length}
              stageLabel={`Stage ${stage.roman} · ${stage.name}`}
              onStart={() => setPhase("question")}
            />
          )}

          {phase === "question" && stage && item && (
            <QuestionView
              key={item.id}
              item={item}
              code={domainCode}
              sectionName={domain.name}
              stageLabel={`Stage ${stage.roman}`}
              index={questionIndex}
              stageTotal={items.length}
              value={responses[item.id]}
              detail={details[item.id]}
              minutesLeft={minutesLeft}
              disabled={pending}
              onAnswer={(v) => answer(item, v)}
              onObserve={(v) => observe(item, v)}
              onSkip={skipObservation}
            />
          )}

          {(phase === "stageUp" || phase === "stageDown") && stage && pendingStage && (
            <StageChange
              up={phase === "stageUp"}
              code={domainCode}
              sectionName={domain.name}
              childName={record.child.name}
              from={stage}
              to={pendingStage}
              questionCount={itemsAt(domainCode, pendingStage.id).length}
              onContinue={continueStage}
            />
          )}

          {phase === "sectionDone" && stage && (
            <SectionComplete
              name={domain.name}
              code={domainCode}
              childName={record.child.name}
              starsEarned={sectionIndex + 1}
              starsTotal={DOMAIN_ORDER.length}
              xp={xp}
              nextName={
                DOMAIN_ORDER[sectionIndex + 1]
                  ? DOMAIN_BY_CODE[DOMAIN_ORDER[sectionIndex + 1]].name
                  : undefined
              }
              onContinue={nextSection}
            />
          )}

          {phase === "finish" && (
            <FinishView
              childName={record.child.name}
              xp={xp}
              stars={DOMAIN_ORDER.length}
              answered={answeredCount}
              unanswered={unansweredScored(stages, responses, itemsAt)}
              onFinish={finish}
              onJumpTo={(itemId) => {
                for (let s = 0; s < DOMAIN_ORDER.length; s++) {
                  const d = DOMAIN_ORDER[s];
                  const list = stages[d] ?? [];
                  for (let st = 0; st < list.length; st++) {
                    const q = itemsAt(d, list[st]).findIndex((i) => i.id === itemId);
                    if (q >= 0) {
                      setSectionIndex(s);
                      setStageOrdinal(st);
                      setQuestionIndex(q);
                      setPhase("question");
                      window.scrollTo({ top: 0, behavior: "instant" });
                      return;
                    }
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
          style={{ fontFamily: "var(--font-sans)", color: "var(--sun-500)" }}
          onAnimationEnd={() => setReward(null)}
        >
          +{reward.amount} XP
        </span>
      )}
    </>
  );
}

/* ══ the walk moved: say so, and say why ═══════════════════════════════════ */

/**
 * Questions appearing after what looked like the end of a stage is the one
 * moment this flow can feel broken. This screen exists so it never does: it
 * names what just happened, in a way that is true both when the child sailed
 * through and when they did not.
 *
 * The downward copy is the careful one. "Let's try some easier ones" after a
 * parent has answered no six times needs to land as the instrument doing its
 * job, not as a verdict — because at this point it genuinely is not one. We do
 * not know where the child is yet. That is the entire reason we are going
 * down.
 */
function StageChange({
  up,
  code,
  sectionName,
  childName,
  from,
  to,
  questionCount,
  onContinue,
}: {
  up: boolean;
  code: DomainCode;
  sectionName: string;
  childName: string;
  from: BrainStage;
  to: BrainStage;
  questionCount: number;
  onContinue: () => void;
}) {
  const color = domainColor(code);
  return (
    <div className="animate-rise pt-6 text-center">
      <p className="eyebrow justify-center" style={{ color }}>
        {sectionName}
      </p>

      <div className="animate-pop mt-6 flex items-center justify-center gap-3">
        <StageChip stage={from} muted />
        <span style={{ color }} className={up ? "" : "rotate-180"}>
          <IconArrowUp />
        </span>
        <StageChip stage={to} />
      </div>

      <h1 className="mt-7 text-[1.5rem] sm:text-[1.75rem]">
        {up ? "That's all in place." : "Let's look a little lower."}
      </h1>
      <p className="lede mx-auto mt-3 max-w-[44ch]">
        {up
          ? `${childName} has everything at stage ${from.roman}. A few questions from stage ${to.roman} will show us how much further they've got.`
          : `We haven't found ${childName}'s level yet, so we'll try stage ${to.roman}. Finding where a child actually is takes a few more questions — that's the whole point of this part.`}
      </p>

      <div className="mt-7 flex justify-center">
        <span className="chip chip-lg">
          <IconSparkle size={15} /> {questionCount} more question
          {questionCount === 1 ? "" : "s"}
        </span>
      </div>

      <Button
        size="lg"
        className="mt-8"
        onClick={onContinue}
        iconRight={<IconArrowRight size={18} />}
      >
        Keep going
      </Button>
    </div>
  );
}

function StageChip({ stage, muted }: { stage: BrainStage; muted?: boolean }) {
  return (
    <span
      className="grid size-16 place-items-center rounded-[var(--radius)] font-extrabold"
      style={{
        background: muted
          ? "var(--surface-2)"
          : `hsl(${stage.hue} 70% 92%)`,
        color: muted ? "var(--ink-3)" : `hsl(${stage.hue} 65% 32%)`,
        fontFamily: "var(--font-display)",
        opacity: muted ? 0.65 : 1,
      }}
      title={stage.name}
    >
      {stage.roman}
    </span>
  );
}

function IconArrowUp() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 19V5m0 0-6 6m6-6 6 6"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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
  stageLabel,
  onStart,
}: {
  index: number;
  total: number;
  code: DomainCode;
  name: string;
  blurb: string;
  questionCount: number;
  stageLabel: string;
  onStart: () => void;
}) {
  return (
    <div className="animate-rise pt-6 text-center">
      <p className="eyebrow justify-center">
        Section {index + 1} of {total} · {stageLabel}
      </p>

      <div className="animate-pop mt-7 flex justify-center">
        <SectionTile code={code} size={104} />
      </div>

      <h1 className="mt-6">{name}</h1>
      <p className="lede mx-auto mt-3 max-w-[40ch]">{blurb}</p>

      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <span className="chip chip-lg">
          <IconSparkle size={15} /> {questionCount} to start
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
        Answer for what they do <em>now</em> — &ldquo;no&rdquo; is just as useful an
        answer, and is how we find their level.
      </p>
    </div>
  );
}

/* ══ one question, one screen ══════════════════════════════════════════════ */

function QuestionView({
  item,
  code,
  sectionName,
  stageLabel,
  index,
  stageTotal,
  value,
  detail,
  minutesLeft,
  disabled,
  onAnswer,
  onObserve,
  onSkip,
}: {
  item: Item;
  code: DomainCode;
  sectionName: string;
  stageLabel: string;
  index: number;
  stageTotal: number;
  value: ResponseValue | undefined;
  detail: string | undefined;
  minutesLeft: number;
  disabled: boolean;
  onAnswer: (v: ResponseValue) => void;
  onObserve: (v: string) => void;
  onSkip: () => void;
}) {
  const color = domainColor(code);
  return (
    <div className="animate-slide-in">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2.5">
          <SectionTile code={code} size={38} />
          <span className="min-w-0">
            <span className="block text-[0.88rem] font-extrabold" style={{ color }}>
              {sectionName}
            </span>
            <span className="block text-[0.74rem] font-bold text-ink-3">
              {stageLabel}
            </span>
          </span>
        </span>
        <span className="flex items-center gap-3">
          <span className="text-[0.82rem] font-bold text-ink-3">
            <span className="tnum">{index + 1}</span> of {stageTotal}
          </span>
          <ProgressRing
            value={((index + 1) / stageTotal) * 100}
            size={40}
            stroke={5}
            color={color}
          >
            <span className="tnum text-[0.62rem] font-extrabold text-ink-3">
              {stageTotal - index - 1}
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

      {item.kind === "yesno" ? (
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
                <span className="block text-[0.8rem] font-medium text-ink-3">
                  {a.hint}
                </span>
              </span>
            </button>
          ))}
        </div>
      ) : (
        <ObservationInput
          item={item}
          value={detail}
          color={color}
          onChange={onObserve}
          onNext={onSkip}
        />
      )}

      <p className="mt-7 flex items-center justify-center gap-2 text-[0.83rem] font-semibold text-ink-3">
        <IconClock size={15} />
        About {minutesLeft} min left · your answers save as you go
      </p>
    </div>
  );
}

/* ══ the booklet's observations ════════════════════════════════════════════ */

/**
 * The questions that are recorded but never scored — how many words, what
 * percentage you understand, which hand they write with.
 *
 * These come straight from the paper booklet, where a clinician writes them in
 * the margin. They tell a professional reading the report something the yes/no
 * answers cannot, but they are observations rather than evidence for or
 * against a stage, so nothing here can move a child up or down the chart.
 *
 * All of them are skippable, and say so. A parent who does not know how many
 * words their child says should move on rather than guess, because a guess
 * recorded as a measurement is worse than a blank.
 */
function ObservationInput({
  item,
  value,
  color,
  onChange,
  onNext,
}: {
  item: Item;
  value: string | undefined;
  color: string;
  onChange: (v: string) => void;
  onNext: () => void;
}) {
  const [draft, setDraft] = useState(value ?? "");

  function commit() {
    const trimmed = draft.trim();
    if (trimmed !== (value ?? "")) onChange(trimmed);
    onNext();
  }

  return (
    <div className="mt-5">
      {item.kind === "choice" && item.choices ? (
        <div className="space-y-3" role="radiogroup" aria-label={item.text}>
          {item.choices.map((choice) => (
            <button
              key={choice}
              type="button"
              role="radio"
              aria-checked={draft === choice}
              data-selected={draft === choice}
              onClick={() => {
                setDraft(choice);
                onChange(choice);
                window.setTimeout(onNext, 320);
              }}
              className="answer"
              style={{ "--tone": color } as React.CSSProperties}
            >
              <span className="answer-key">{choice.charAt(0)}</span>
              <span>{choice}</span>
            </button>
          ))}
        </div>
      ) : item.kind === "text" ? (
        <textarea
          className="field min-h-28"
          rows={3}
          value={draft}
          placeholder="Type as much or as little as you like"
          onChange={(e) => setDraft(e.target.value)}
        />
      ) : (
        <div className="flex items-center gap-3">
          <input
            className="field flex-1"
            type="number"
            inputMode="numeric"
            min={0}
            max={item.kind === "percent" ? 100 : undefined}
            value={draft}
            placeholder="0"
            onChange={(e) => setDraft(e.target.value)}
          />
          {item.unit && (
            <span className="shrink-0 text-[0.95rem] font-bold text-ink-3">
              {item.unit}
            </span>
          )}
        </div>
      )}

      <div className="mt-5 flex items-center gap-3">
        <Button onClick={commit} iconRight={<IconArrowRight size={18} />}>
          {draft.trim() ? "Save and continue" : "Continue"}
        </Button>
        <button
          type="button"
          onClick={onNext}
          className="btn btn-ghost text-[0.88rem]"
        >
          I&rsquo;m not sure — skip
        </button>
      </div>

      <p className="mt-4 text-[0.82rem] text-ink-3">
        This one is just for the report. It doesn&rsquo;t change{" "}
        {item.kind === "choice" ? "their result" : "the result"} either way.
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
  answered,
  unanswered,
  onFinish,
  onJumpTo,
}: {
  childName: string;
  xp: number;
  stars: number;
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
          ? `You answered all ${answered} questions about ${childName}. Submit to build their report.`
          : "You can submit without these — we leave them out rather than counting them as a no."}
      </p>

      <div className="mx-auto mt-8 grid max-w-[26rem] grid-cols-3 gap-3">
        {[
          { value: String(xp), label: "XP earned", color: "var(--sun-500)" },
          { value: `${stars}/6`, label: "Stars", color: "var(--accent)" },
          { value: String(answered), label: "Answered", color: "var(--st-on-track)" },
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

/** Scored questions still without an answer, across every stage asked. */
function unansweredScored(
  stages: Record<DomainCode, string[]>,
  responses: Record<string, ResponseValue>,
  itemsAt: (domain: DomainCode, stage: string | undefined) => Item[],
): Item[] {
  const out: Item[] = [];
  for (const domain of DOMAIN_ORDER) {
    for (const stage of stages[domain] ?? []) {
      for (const item of itemsAt(domain, stage)) {
        if (item.kind === "yesno" && responses[item.id] === undefined) out.push(item);
      }
    }
  }
  return out;
}

function DotGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="2.6" fill="currentColor" />
    </svg>
  );
}
