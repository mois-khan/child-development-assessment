"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { formatAge, summariseAge, todayISO } from "@/lib/age";
import { getChild, type SavedChild } from "@/lib/store";
import { ChildCard, Shell, TopBar } from "@/components/ui";

export default function AssessmentListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [child, setChild] = useState<SavedChild | null | undefined>(undefined);

  useEffect(() => {
    setChild(getChild(id));
  }, [id]);

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
  if (child === null) {
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

  const age = summariseAge(child.dob, todayISO(), child.gestationalWeeks);

  return (
    <>
      <TopBar
        right={
          <Link href={`/children/${child.id}`} className="btn btn-quiet btn-sm">
            Back to profile
          </Link>
        }
      />
      <main className="pb-24">
        <Shell>
          <div className="animate-rise mt-8 flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow eyebrow-accent">Step 1 of 2</p>
              <h1 className="mt-3">Choose an assessment</h1>
            </div>
            <ChildCard name={child.name} ageLabel={`${formatAge(age.chronologicalMonths)} old`} />
          </div>

          <div className="mt-9 space-y-4">
            <Link
              href={`/children/${child.id}/pay`}
              className="card card-raised block p-5 transition-transform hover:-translate-y-0.5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-[1.08rem]">Genius Milestones Check</h3>
                  <p className="mt-1.5 max-w-[48ch] text-[0.88rem] leading-relaxed text-ink-2">
                    Around seventy short questions across six areas — visual, auditory, tactile,
                    mobility, language and manual — with the right module chosen automatically for{" "}
                    {child.name}&rsquo;s age. About ten minutes.
                  </p>
                </div>
                <span className="chip shrink-0" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                  ₹99
                </span>
              </div>
              <span className="btn btn-primary mt-4">Select</span>
            </Link>

            <div className="card p-5 opacity-60">
              <h3 className="text-[1.02rem]">More assessments</h3>
              <p className="mt-1.5 text-[0.85rem] text-ink-3">Coming soon.</p>
            </div>
          </div>
        </Shell>
      </main>
    </>
  );
}
