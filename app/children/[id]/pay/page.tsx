"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DOMAINS, bandIdsForModule, moduleForAge } from "@/content/domains";
import { itemsForModule } from "@/content/items";
import { formatAge, summariseAge, todayISO } from "@/lib/age";
import { createAssessment, getChild, markUnlocked, type SavedChild } from "@/lib/store";
import { ChildCard, ModuleChip, Shell, Tick, TopBar } from "@/components/ui";

const ASSESSMENT_SLUG = "genius-milestones-check";
const VALID_COUPON = "GENIUS99";

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

  const currentModule = age ? moduleForAge(age.assessedMonths) : null;

  const questionCount = useMemo(() => {
    if (!currentModule) return 0;
    return DOMAINS.reduce((n, d) => n + itemsForModule(currentModule.id, d.code).length, 0);
  }, [currentModule]);

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
    if (!child || !age || !currentModule) return;
    setStarting(true);
    markUnlocked(child.id, ASSESSMENT_SLUG);
    const bandIds = bandIdsForModule(currentModule.id);
    const bandsByDomain = Object.fromEntries(
      DOMAINS.map((d) => [d.code, bandIds]),
    ) as Record<(typeof DOMAINS)[number]["code"], string[]>;
    const record = createAssessment(child, today, bandsByDomain);
    router.push(`/assessment/${record.id}`);
  }

  if (child === undefined) {
    return (
      <>
        <TopBar />
        <Shell>
          <p className="pt-24 text-center text-[0.9rem] text-ink-3">Loading…</p>
        </Shell>
      </>
    );
  }
  if (child === null || !age) {
    return (
      <>
        <TopBar />
        <Shell>
          <div className="pt-20">
            <h1>We couldn&rsquo;t find that child</h1>
            <Link href="/children" className="btn btn-primary mt-7">
              Go to your children
            </Link>
          </div>
        </Shell>
      </>
    );
  }

  return (
    <>
      <TopBar
        right={
          <Link href={`/children/${child.id}/assessments`} className="btn btn-quiet btn-sm">
            Back
          </Link>
        }
      />
      <main className="pb-24">
        <Shell>
          <div className="animate-rise mt-8 flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow eyebrow-accent">Step 2 of 2</p>
              <h1 className="mt-3">Unlock the check</h1>
            </div>
            <ChildCard name={child.name} ageLabel={`${formatAge(age.chronologicalMonths)} old`} />
          </div>

          <div className="card card-pastel-amber animate-rise mt-8 !p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[1.02rem]">Genius Milestones Check</h3>
                <p className="mt-1 text-[0.85rem] text-ink-2">
                  {questionCount} questions, about ten minutes
                </p>
                {currentModule && (
                  <div className="mt-2.5">
                    <ModuleChip moduleLabel={`Module ${currentModule.id} of 7 · ${currentModule.name}`} />
                  </div>
                )}
              </div>
              <p className="text-[1.5rem] font-bold text-ink">₹99</p>
            </div>
          </div>

          <div className="card animate-rise mt-5 p-6">
            {applied ? (
              <div className="flex items-center gap-3">
                <span className="animate-pop flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--st-on-track-soft)]">
                  <Tick size={18} color="var(--st-on-track)" />
                </span>
                <div>
                  <p className="text-[0.95rem] font-semibold text-ink">Code applied — this one&rsquo;s free!</p>
                  <p className="text-[0.8rem] text-ink-3">Coupon GENIUS99</p>
                </div>
              </div>
            ) : (
              <>
                <p className="text-[0.85rem] text-ink-3">
                  Online payment is coming soon. For now, use your coupon code below to unlock the check
                  for free.
                </p>
                <form onSubmit={applyCoupon} className="mt-4 flex flex-wrap items-start gap-3">
                  <div className="min-w-[12rem] flex-1">
                    <input
                      className={`field ${error ? "field-error" : ""}`}
                      placeholder="Coupon code"
                      value={coupon}
                      onChange={(e) => {
                        setCoupon(e.target.value);
                        setError("");
                      }}
                      autoComplete="off"
                    />
                    {error && <p className="hint hint-error">{error}</p>}
                  </div>
                  <button type="submit" className="btn btn-ghost">
                    Apply code
                  </button>
                </form>
              </>
            )}
          </div>

          <div className="mt-8 flex items-center gap-3">
            <button
              type="button"
              className="btn btn-primary"
              disabled={!applied || starting}
              onClick={startAssessment}
            >
              {starting ? "Preparing questions…" : "Start assessment"}
            </button>
            {!applied && (
              <span className="text-[0.83rem] text-ink-3">Apply a coupon code to continue</span>
            )}
          </div>
        </Shell>
      </main>
    </>
  );
}
