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
  DoneBanner,
  ModuleChip,
  Shell,
  Tick,
  TopBar,
  domainColor,
} from "@/components/ui";

interface Section {
  key: string;
  domain: DomainCode;
  items: Item[];
}

const ANSWERS: [ResponseValue, string][] = [
  [2, "Yes"],
  [1, "Sometimes"],
  [0, "Not yet"],
];

export default function AssessmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [record, setRecord] = useState<StoredAssessment | null | undefined>(
    undefined,
  );
  const [responses, setResponses] = useState<Record<string, ResponseValue>>({});
  const [step, setStep] = useState(0);
  const [showGaps, setShowGaps] = useState(false);
  const [celebrating, setCelebrating] = useState(false);

  useEffect(() => {
    const found = getAssessment(id);
    setRecord(found);
    if (found) setResponses(found.responses);
  }, [id]);

  // Exactly six sections, one per section/domain, driven entirely by the
  // child's module (their age) — fixed and known upfront, never adaptive.
  // See content/domains.ts (MODULE_BANDS) and content/items.ts (itemsForModule).
  const sections: Section[] = useMemo(() => {
    if (!record) return [];
    const moduleId = moduleForAge(monthsFor(record)).id;
    return DOMAINS.map((d) => ({
      key: d.code,
      domain: d.code,
      items: itemsForModule(moduleId, d.code),
    }));
  }, [record]);

  const allItems = useMemo(() => sections.flatMap((s) => s.items), [sections]);
  const answeredCount = allItems.filter(
    (i) => responses[i.id] !== undefined,
  ).length;

  const answer = useCallback(
    (itemId: string, value: ResponseValue) => {
      setResponses((prev) => ({ ...prev, [itemId]: value }));
      saveResponse(id, itemId, value);
    },
    [id],
  );

  if (record === undefined) return <Loading />;
  if (record === null)
    return <NotFound onStart={() => router.push("/children")} />;

  const childAge = summariseAge(
    record.child.dob,
    record.assessedOn,
    record.child.gestationalWeeks,
  );
  const currentModule = moduleForAge(childAge.assessedMonths);

  const onReview = step >= sections.length;
  const section = sections[step];
  const sectionRemaining = section
    ? section.items.filter((i) => responses[i.id] === undefined).length
    : 0;
  const sectionDone = sectionRemaining === 0;
  const unanswered = allItems.filter((i) => responses[i.id] === undefined);
  const isLast = step === sections.length - 1;
  const sectionsLeft = sections.length - step - 1;

  function goNext() {
    setStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  function goBack() {
    setStep((s) => Math.max(0, s - 1));
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  function finish() {
    completeAssessment(id);
    setCelebrating(true);
    window.setTimeout(() => {
      router.push(`/report/${id}`);
    }, 1500);
  }

  if (celebrating) {
    return <Celebration name={record.child.name} />;
  }

  return (
    <>
      <TopBar
        right={
          <span className="text-[0.82rem] text-ink-3">
            <span className="font-semibold text-ink">{record.child.name}</span>
            {" · "}
            <span className="tabular-nums">
              {answeredCount} / {allItems.length}
            </span>
          </span>
        }
      />

      <div className="no-print sticky top-[4.25rem] z-20 bg-[var(--ground)]/92 backdrop-blur-md">
        <div className="progress-track" style={{ borderRadius: 0 }}>
          <div
            className="progress-fill"
            style={{
              width: `${allItems.length === 0 ? 0 : (answeredCount / allItems.length) * 100}%`,
            }}
          />
        </div>
        {!onReview && section && (
          <div className="mx-auto flex w-full max-w-[78rem] items-center px-5 py-1.5 sm:px-10">
            <ModuleChip
              moduleLabel={`Module ${currentModule.id} of 7 · ${currentModule.name}`}
              sectionLabel={DOMAIN_BY_CODE[section.domain].name}
            />
          </div>
        )}
      </div>

      <main className="pb-32">
        <Shell>
          {onReview ? (
            <Review
              name={record.child.name}
              total={allItems.length}
              unanswered={unanswered}
              showGaps={showGaps}
              onShowGaps={() => setShowGaps(true)}
              onBack={goBack}
              onFinish={finish}
              onJumpTo={(itemId) => {
                const idx = sections.findIndex((s) =>
                  s.items.some((i) => i.id === itemId),
                );
                if (idx >= 0) {
                  setStep(idx);
                  window.scrollTo({ top: 0, behavior: "instant" });
                }
              }}
            />
          ) : (
            <>
              <StepDots sections={sections} step={step} />

              <SectionIntro
                key={section.key}
                section={section}
                index={step}
                total={sections.length}
                childName={record.child.name}
              />

              <ol className="mt-7 list-none space-y-3 p-0">
                {section.items.map((item) => (
                  <li key={item.id}>
                    <Question
                      item={item}
                      value={responses[item.id]}
                      onAnswer={(v) => answer(item.id, v)}
                    />
                  </li>
                ))}
              </ol>

              {sectionDone && (
                <div className="mt-6">
                  <DoneBanner>
                    {sectionsLeft === 0
                      ? `${DOMAIN_BY_CODE[section.domain].name} done. That’s every section.`
                      : `${DOMAIN_BY_CODE[section.domain].name} done. ${sectionsLeft} section${sectionsLeft === 1 ? "" : "s"} to go.`}
                  </DoneBanner>
                </div>
              )}

              <p className="mt-8 text-center text-[0.78rem] text-ink-3">
                Your answers save as you go. You can close this and come back.
              </p>
            </>
          )}
        </Shell>
      </main>

      {/* Always visible without scrolling — the whole point of a fixed bar. */}
      {!onReview && (
        <div className="action-bar">
          <Shell>
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={goBack}
                disabled={step === 0}
              >
                Back
              </button>
              <div className="flex items-center gap-3">
                {!sectionDone && (
                  <span className="hidden text-[0.83rem] tabular-nums text-ink-3 sm:inline">
                    {sectionRemaining} left
                  </span>
                )}
                <button
                  type="button"
                  className={`btn ${sectionDone ? "btn-primary" : "btn-ghost"}`}
                  onClick={goNext}
                >
                  {isLast ? "Review answers" : "Next section"}
                </button>
              </div>
            </div>
          </Shell>
        </div>
      )}
    </>
  );
}

/* ── pieces ─────────────────────────────────────────────────────────────── */

function StepDots({ sections, step }: { sections: Section[]; step: number }) {
  return (
    <div className="flex gap-1.5 pt-5" aria-hidden="true">
      {sections.map((s, i) => (
        <span
          key={s.key}
          className="step-dot flex-1"
          data-state={i < step ? "done" : i === step ? "current" : "todo"}
        />
      ))}
    </div>
  );
}

function SectionIntro({
  section,
  index,
  total,
  childName,
}: {
  section: Section;
  index: number;
  total: number;
  childName: string;
}) {
  const domain = DOMAIN_BY_CODE[section.domain];
  return (
    <div className="animate-rise pt-5">
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden="true"
          className="block h-[3px] w-7 rounded-full"
          style={{ background: domainColor(section.domain) }}
        />
        <span className="eyebrow">
          Part {index + 1} of {total}
        </span>
      </div>

      <h1 className="mt-4">{domain.name}</h1>

      <p className="lede mt-2.5 max-w-[48ch]">
        {domain.blurb.replace("your child", childName)}
      </p>
    </div>
  );
}

function Question({
  item,
  value,
  onAnswer,
}: {
  item: Item;
  value: ResponseValue | undefined;
  onAnswer: (v: ResponseValue) => void;
}) {
  const answered = value !== undefined;
  return (
    <div className="q-card" data-answered={answered}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[0.98rem] font-medium leading-snug text-ink">
          {item.text}
        </p>
        {answered && (
          <span className="animate-pop mt-0.5 shrink-0">
            <Tick size={17} />
          </span>
        )}
      </div>

      <p className="mt-2 text-[0.82rem] leading-relaxed text-ink-3">
        <span className="font-semibold text-ink-2">How to check</span>{" "}
        {item.how}
      </p>

      <div role="radiogroup" aria-label={item.text} className="seg mt-3.5">
        {ANSWERS.map(([v, label]) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={value === v}
            data-value={v}
            onClick={() => onAnswer(v)}
            className="seg-btn"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Review({
  name,
  total,
  unanswered,
  showGaps,
  onShowGaps,
  onBack,
  onFinish,
  onJumpTo,
}: {
  name: string;
  total: number;
  unanswered: Item[];
  showGaps: boolean;
  onShowGaps: () => void;
  onBack: () => void;
  onFinish: () => void;
  onJumpTo: (itemId: string) => void;
}) {
  const complete = unanswered.length === 0;
  return (
    <div className="animate-rise pt-14">
      {complete && (
        <span className="animate-pop mb-6 flex size-12 items-center justify-center rounded-full bg-[var(--accent-soft)]">
          <Tick size={24} />
        </span>
      )}

      <h1>
        {complete
          ? "All done!"
          : `Almost there — ${unanswered.length} question${unanswered.length === 1 ? "" : "s"} left`}
      </h1>

      <p className="prose-read mt-4 max-w-[50ch]">
        {complete
          ? `You answered all ${total} questions about ${name}. Let's turn that into a report!`
          : "You can finish without these — we leave them out of the scoring rather than counting them as a no. Answering them makes the report more accurate."}
      </p>

      {!complete && (
        <div className="mt-7">
          {!showGaps ? (
            <button type="button" className="btn btn-ghost" onClick={onShowGaps}>
              Show what&rsquo;s missing
            </button>
          ) : (
            <ul className="animate-rise list-none space-y-2 p-0">
              {unanswered.slice(0, 12).map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onJumpTo(item.id)}
                    className="card w-full p-3.5 text-left transition-colors hover:border-[var(--accent)]"
                  >
                    <span className="eyebrow block">
                      {DOMAIN_BY_CODE[item.domain].name}
                    </span>
                    <span className="mt-1 block text-[0.9rem] text-ink-2">
                      {item.text}
                    </span>
                  </button>
                </li>
              ))}
              {unanswered.length > 12 && (
                <li className="pt-1 text-[0.83rem] text-ink-3">
                  and {unanswered.length - 12} more
                </li>
              )}
            </ul>
          )}
        </div>
      )}

      <div className="mt-10 flex flex-wrap items-center gap-3">
        <button type="button" className="btn btn-primary" onClick={onFinish}>
          See {name}&rsquo;s report
        </button>
        <button type="button" className="btn btn-quiet" onClick={onBack}>
          Back to questions
        </button>
      </div>
    </div>
  );
}

/** Full-screen celebration shown right after submitting, before the report loads. */
function Celebration({ name }: { name: string }) {
  const confetti = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        left: Math.round((i * 137.5) % 100),
        delay: (i % 7) * 0.09,
        duration: 1.6 + (i % 5) * 0.22,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        size: 6 + (i % 4) * 3,
      })),
    [],
  );

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "var(--ground)" }}
      role="status"
      aria-live="polite"
    >
      {confetti.map((c, i) => (
        <span
          key={i}
          className="confetti-piece"
          aria-hidden="true"
          style={{
            left: `${c.left}%`,
            width: c.size,
            height: c.size * 0.6,
            background: c.color,
            animationDelay: `${c.delay}s`,
            animationDuration: `${c.duration}s`,
          }}
        />
      ))}

      <span
        className="celebrate-ring flex size-24 items-center justify-center rounded-full"
        style={{ background: "var(--st-on-track-soft)" }}
      >
        <Tick size={48} color="var(--st-on-track)" />
      </span>

      <h1 className="animate-rise mt-7 text-center" style={{ animationDelay: "150ms" }}>
        Amazing work, {name}!
      </h1>
      <p
        className="animate-rise lede mt-2 text-center"
        style={{ animationDelay: "250ms" }}
      >
        Building the report now…
      </p>
    </div>
  );
}

const CONFETTI_COLORS = [
  "var(--accent)",
  "var(--st-on-track)",
  "var(--pastel-pink-2)",
  "var(--pastel-amber-2)",
  "var(--pastel-green-2)",
];

function Loading() {
  return (
    <>
      <TopBar />
      <Shell>
        <p className="pt-24 text-center text-[0.9rem] text-ink-3">Loading…</p>
      </Shell>
    </>
  );
}

function NotFound({ onStart }: { onStart: () => void }) {
  return (
    <>
      <TopBar />
      <Shell>
        <div className="pt-20">
          <h1>We couldn&rsquo;t find that assessment</h1>
          <p className="prose-read mt-3 max-w-[46ch]">
            Assessments are saved in this browser only, so a link from another
            device won&rsquo;t open here.
          </p>
          <button
            type="button"
            className="btn btn-primary mt-7"
            onClick={onStart}
          >
            Go to your children
          </button>
        </div>
      </Shell>
    </>
  );
}

/* ── helpers ────────────────────────────────────────────────────────────── */

/** The age the questions are chosen from — corrected age for preterm babies. */
function monthsFor(record: StoredAssessment): number {
  return summariseAge(
    record.child.dob,
    record.assessedOn,
    record.child.gestationalWeeks,
  ).assessedMonths;
}

