"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AGE_BANDS, DOMAINS, DOMAIN_BY_CODE } from "@/content/domains";
import { itemsFor } from "@/content/items";
import { summariseAge } from "@/lib/age";
import { MAX_EXTENSION_ROUNDS, extensionsFor, initialWindow } from "@/lib/scoring";
import {
  completeAssessment,
  extendBands,
  getAssessment,
  saveResponse,
  type StoredAssessment,
} from "@/lib/store";
import type { DomainCode, Item, ResponseValue } from "@/lib/types";
import { DoneBanner, Shell, Tick, TopBar, domainColor } from "@/components/ui";

interface Section {
  key: string;
  domain: DomainCode;
  items: Item[];
  extension: boolean;
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
  const [rounds, setRounds] = useState(0);
  const [showGaps, setShowGaps] = useState(false);

  useEffect(() => {
    const found = getAssessment(id);
    setRecord(found);
    if (found) setResponses(found.responses);
  }, [id]);

  const baseSections: Section[] = useMemo(() => {
    if (!record) return [];
    const bandIds = initialWindow(monthsFor(record)).map((b) => b.id);
    return DOMAINS.map((d) => ({
      key: `base-${d.code}`,
      domain: d.code,
      items: orderItems(bandIds, d.code),
      extension: false,
    }));
  }, [record]);

  // Anything the adaptive rounds have added beyond the starting window.
  const extraSections: Section[] = useMemo(() => {
    if (!record || rounds === 0) return [];
    const baseBands = new Set(initialWindow(monthsFor(record)).map((b) => b.id));
    return DOMAINS.map((d) => ({
      key: `ext-${d.code}`,
      domain: d.code,
      items: orderItems(
        (record.bandsByDomain[d.code] ?? []).filter((b) => !baseBands.has(b)),
        d.code,
      ),
      extension: true,
    })).filter((s) => s.items.length > 0);
  }, [record, rounds]);

  const sections = useMemo(
    () => [...baseSections, ...extraSections],
    [baseSections, extraSections],
  );

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
  if (record === null) return <NotFound onStart={() => router.push("/start")} />;

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
    // At the end of every round, check whether any domain still needs a band
    // reaching further down (the basal rule) or one further up. Keep going
    // until nothing new comes back, so the developmental age is anchored to a
    // band the child actually mastered rather than to where we began asking.
    if (isLast && rounds < MAX_EXTENSION_ROUNDS) {
      const ext = extensionsFor(record!.bandsByDomain, responses);
      setRounds((r) => r + 1);
      if (Object.values(ext).some((b) => b.length > 0)) {
        extendBands(id, ext);
        const updated = getAssessment(id);
        if (updated) setRecord(updated);
      }
    }
    setStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  function goBack() {
    setStep((s) => Math.max(0, s - 1));
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  return (
    <>
      <TopBar
        right={
          <span className="text-[0.82rem] font-semibold tabular-nums text-ink-3">
            {answeredCount} / {allItems.length}
          </span>
        }
      />

      <div className="no-print sticky top-[4.25rem] z-20">
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{
              width: `${allItems.length === 0 ? 0 : (answeredCount / allItems.length) * 100}%`,
            }}
          />
        </div>
      </div>

      <main className="pb-28">
        <Shell>
          {onReview ? (
            <Review
              name={record.child.name}
              total={allItems.length}
              unanswered={unanswered}
              showGaps={showGaps}
              onShowGaps={() => setShowGaps(true)}
              onBack={goBack}
              onFinish={() => {
                completeAssessment(id);
                router.push(`/report/${id}`);
              }}
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
                    {section.extension
                      ? "That’s the last of them — let’s build the report."
                      : sectionsLeft === 0
                        ? `${DOMAIN_BY_CODE[section.domain].name} done. That’s every section.`
                        : `${DOMAIN_BY_CODE[section.domain].name} done. ${sectionsLeft} section${sectionsLeft === 1 ? "" : "s"} to go.`}
                  </DoneBanner>
                </div>
              )}

              <div className="mt-7 flex items-center justify-between gap-3">
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
                    <span className="text-[0.83rem] tabular-nums text-ink-3">
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

              <p className="mt-8 text-center text-[0.78rem] text-ink-3">
                Your answers save as you go. You can close this and come back.
              </p>
            </>
          )}
        </Shell>
      </main>
    </>
  );
}

/* ── pieces ─────────────────────────────────────────────────────────────── */

function StepDots({ sections, step }: { sections: Section[]; step: number }) {
  return (
    <div className="flex gap-1.5 pt-8" aria-hidden="true">
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
    <div className="animate-rise pt-7">
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden="true"
          className="block h-[3px] w-7 rounded-full"
          style={{ background: domainColor(section.domain) }}
        />
        <span className="eyebrow">
          Part {index + 1} of {total}
          {section.extension && " · A few more"}
        </span>
      </div>

      <h1 className="mt-4">{domain.name}</h1>

      <p className="lede mt-2.5 max-w-[48ch]">
        {section.extension
          ? `From the answers so far, a few more questions here will show us more clearly where ${childName} is.`
          : domain.blurb.replace("your child", childName)}
      </p>

      <p className="mt-4 max-w-[52ch] text-[0.85rem] leading-relaxed text-ink-3">
        Answer for what {childName} does <em>now</em>, not what they managed
        once. &ldquo;Not yet&rdquo; is a useful answer &mdash; it is how we find
        the right starting point.
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
        <span className="animate-pop mb-6 flex size-12 items-center justify-center rounded-full bg-[var(--pine-soft)]">
          <Tick size={24} />
        </span>
      )}

      <h1>
        {complete
          ? "All done."
          : `Almost there — ${unanswered.length} question${unanswered.length === 1 ? "" : "s"} left`}
      </h1>

      <p className="prose-read mt-4 max-w-[50ch]">
        {complete
          ? `You answered all ${total} questions about ${name}. We'll turn that into a report now.`
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
                    className="card w-full p-3.5 text-left transition-colors hover:border-[var(--pine)]"
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
            Start a new one
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

/** Questions run easiest to hardest, with no band labels shown to the parent. */
function orderItems(bandIds: string[], domain: DomainCode): Item[] {
  return AGE_BANDS.filter((b) => bandIds.includes(b.id))
    .sort((a, b) => a.order - b.order)
    .flatMap((b) => itemsFor(b.id, domain));
}
