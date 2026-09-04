"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DOMAINS } from "@/content/domains";
import { scoredItemsFor } from "@/content/items";
import { stageForAge } from "@/lib/stage";
import { formatAge, summariseAge, todayISO } from "@/lib/age";
import { createAssessment, getChild, markUnlocked, type SavedChild } from "@/lib/store";
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  ChildCard,
  Footer,
  IconArrowRight,
  IconCheck,
  IconClock,
  IconShield,
  IconSparkle,
  Mascot,
  Section,
  SectionTile,
  Shell,
  TopBar,
  domainColor,
} from "@/components/ui";

const ASSESSMENT_SLUG = "genius-milestones-check";
const VALID_COUPON = "GENIUS99";
const PRICE = 99;

/**
 * Start the check — one screen, one decision.
 *
 * This used to be two pages: a "choose a check" screen that showed the one
 * real option next to two greyed-out "coming soon" cards and made a parent
 * click "Continue" to confirm the only choice available, then a separate
 * "unlock" screen for the coupon. Picking among one option isn't a choice, so
 * that click was pure friction — merged here into a single screen: what the
 * check covers, then the one thing that actually needs a decision (the
 * coupon), then go.
 */
export default function PayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [child, setChild] = useState<SavedChild | null | undefined>(undefined);
  const [coupon, setCoupon] = useState("");
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    setChild(getChild(id));
  }, [id]);

  const today = todayISO();
  const age = useMemo(
    () => (child ? summariseAge(child.dob, today, child.gestationalWeeks) : null),
    [child, today],
  );
  const startStage = age ? stageForAge(age.assessedMonths) : null;

  /* The assessment adapts as it goes, so the real length is not knowable up
     front — a child who passes everything climbs, one who does not descends.
     What we can show honestly is where it starts, and that most checks land
     within a stage or two of that. */
  const perSection = useMemo(() => {
    if (!startStage || !age) return [];
    return DOMAINS.map((d) => ({
      code: d.code,
      name: d.name,
      count: scoredItemsFor(startStage.id, d.code, age.assessedMonths).length,
    }));
  }, [startStage, age]);
  const questionCount = perSection.reduce((n, s) => n + s.count, 0);

  function applyCoupon(e: React.FormEvent) {
    e.preventDefault();
    if (coupon.trim().toUpperCase() === VALID_COUPON) {
      setApplied(true);
      setError("");
    } else {
      setError("That code doesn't look right — check and try again.");
    }
  }

  function startAssessment() {
    if (!child || !age || !startStage) return;
    setStarting(true);
    markUnlocked(child.id, ASSESSMENT_SLUG);
    // Every competence opens on the same stage — the one the child's age
    // points at. Where each goes from there is decided question by question.
    const stagesByDomain = Object.fromEntries(
      DOMAINS.map((d) => [d.code, [startStage.id]]),
    ) as Record<(typeof DOMAINS)[number]["code"], string[]>;
    const record = createAssessment(child, today, stagesByDomain);
    router.push(`/assessment/${record.id}`);
  }

  if (child === undefined) {
    return (
      <>
        <TopBar />
        <Shell>
          <p className="pt-24 text-center font-semibold text-ink-3">Loading…</p>
        </Shell>
      </>
    );
  }
  if (child === null || !age || !startStage) {
    return (
      <>
        <TopBar />
        <Shell width="narrow">
          <div className="pt-20 text-center">
            <Mascot size={90} mood="think" className="mx-auto" />
            <h1 className="mt-6">We couldn&rsquo;t find that child</h1>
            <ButtonLink href="/children" className="mt-8">
              Go to your children
            </ButtonLink>
          </div>
        </Shell>
      </>
    );
  }

  return (
    <>
      <TopBar />

      <main>
        <Section size="sm">
          <Shell width="reading">
            <div className="flex flex-wrap items-end justify-between gap-5">
              <div>
                <p className="eyebrow eyebrow-accent">Genius Milestone Check</p>
                <h1 className="mt-3">Start {child.name}&rsquo;s check</h1>
                <p className="lede mt-3 max-w-[46ch]">
                  Built for {child.name}&rsquo;s exact stage — Stage {startStage.roman},{" "}
                  {startStage.name}.
                </p>
              </div>
              <ChildCard
                name={child.name}
                photoUrl={child.photoUrl}
                ageLabel={`${formatAge(age.chronologicalMonths)} old`}
              />
            </div>

            <Card variant="clay" className="clay-lg mt-8 overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-4 p-6 sm:p-7">
                <div className="flex flex-wrap gap-2">
                  <Badge tone="accent" size="lg">
                    <IconSparkle size={14} /> Stage {startStage.roman} · {startStage.name}
                  </Badge>
                  <Badge tone="neutral">from {questionCount} questions</Badge>
                  <Badge tone="neutral">
                    <IconClock size={14} /> ~10 min
                  </Badge>
                </div>
                <div className="text-right">
                  <p
                    className="tnum text-[2rem] font-extrabold leading-none text-ink"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {applied ? "₹0" : `₹${PRICE}`}
                  </p>
                  {applied && (
                    <p className="tnum mt-1 text-[0.85rem] font-bold text-ink-3 line-through">
                      ₹{PRICE}
                    </p>
                  )}
                </div>
              </div>

              {/* what's inside — the "which check" question, answered rather
                  than asked, since there is only ever one real option today */}
              <div className="border-t border-line-soft bg-[var(--surface-2)] p-6 sm:p-7">
                <p className="eyebrow mb-4">Six short sections, one question at a time</p>
                <ul className="grid list-none gap-3 p-0 sm:grid-cols-2">
                  {perSection.map((s) => (
                    <li key={s.code} className="flex items-center gap-3">
                      <SectionTile code={s.code} size={38} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[0.9rem] font-bold text-ink">
                          {s.name}
                        </span>
                        <span
                          className="block text-[0.78rem] font-semibold"
                          style={{ color: domainColor(s.code) }}
                        >
                          {s.count} question{s.count === 1 ? "" : "s"}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-line-soft p-6 sm:p-7">
                {applied ? (
                  <div className="flex items-center gap-4">
                    <span className="animate-pop grid size-12 shrink-0 place-items-center rounded-full bg-[var(--st-on-track-soft)] text-[var(--st-on-track)]">
                      <IconCheck size={26} />
                    </span>
                    <div>
                      <p className="text-[1.02rem] font-extrabold text-ink">
                        Code applied — this one&rsquo;s on us
                      </p>
                      <p className="text-[0.85rem] font-semibold text-ink-3">
                        Coupon {VALID_COUPON} · launch offer
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-[0.9rem] font-medium leading-relaxed text-ink-2">
                      Online payment is arriving shortly. During launch, use your coupon code to
                      unlock the check for free.
                    </p>
                    <form onSubmit={applyCoupon} className="mt-4 flex flex-wrap items-start gap-3">
                      <div className="min-w-[13rem] flex-1">
                        <input
                          className={`field ${error ? "field-error" : ""}`}
                          placeholder="Enter coupon code"
                          value={coupon}
                          onChange={(e) => {
                            setCoupon(e.target.value);
                            setError("");
                          }}
                          autoComplete="off"
                          aria-label="Coupon code"
                        />
                        {error && <p className="hint hint-error">{error}</p>}
                      </div>
                      <Button type="submit" variant="secondary" size="lg">
                        Apply
                      </Button>
                    </form>
                  </>
                )}
              </div>
            </Card>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button
                size="lg"
                disabled={!applied || starting}
                onClick={startAssessment}
                iconRight={<IconArrowRight size={18} />}
              >
                {starting ? "Preparing questions…" : "Start the check"}
              </Button>
              {!applied && (
                <span className="text-[0.88rem] font-semibold text-ink-3">
                  Apply a coupon code to continue
                </span>
              )}
            </div>

            <div className="mt-8 flex items-start gap-3 rounded-[var(--radius)] border border-line bg-[var(--surface)] p-4">
              <span className="mt-0.5 text-accent">
                <IconShield size={20} />
              </span>
              <p className="text-[0.85rem] leading-relaxed text-ink-2">
                Everything you enter stays on this device. We never send your child&rsquo;s answers
                or photo anywhere.
              </p>
            </div>
          </Shell>
        </Section>
      </main>

      <Footer />
    </>
  );
}
