"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { adminGetSubmission, type AdminSubmission } from "@/lib/admin/data";
import { STATUSES } from "@/lib/scoring";
import { formatAge, summariseAge } from "@/lib/age";
import { DOMAIN_BY_CODE } from "@/content/domains";
import {
  Avatar,
  Badge,
  ButtonLink,
  Card,
  IconArrowLeft,
  Meter,
  StatusChip,
  domainColor,
} from "@/components/ui";

export default function AdminSubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [submission, setSubmission] = useState<AdminSubmission | null | undefined>(undefined);

  useEffect(() => {
    adminGetSubmission(id).then(setSubmission);
  }, [id]);

  if (submission === undefined) return <p className="text-[0.9rem] text-ink-3">Loading…</p>;

  if (submission === null) {
    return (
      <div className="space-y-4">
        <BackLink />
        <Card className="!p-8 text-center">
          <p className="text-[0.92rem] text-ink-3">No submission found with that id.</p>
        </Card>
      </div>
    );
  }

  const { assessment, result } = submission;
  const age = summariseAge(assessment.child.dob, assessment.assessedOn, assessment.child.gestationalWeeks);

  return (
    <div className="space-y-6">
      <BackLink />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar name={assessment.child.name} size={56} />
          <div>
            <h1 className="!text-[1.4rem]">{assessment.child.name}</h1>
            <p className="text-[0.85rem] text-ink-3">
              {formatAge(age.chronologicalMonths)} old · {assessment.child.gender} · Assessed{" "}
              {assessment.assessedOn}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          {!assessment.completedAt && <Badge tone="neutral">In progress</Badge>}
          {result && !result.suppressDq && (
            <StatusChip status={result.overallStatus} label={STATUSES[result.overallStatus].label} size="lg" />
          )}
          <ButtonLink href={`/report/${assessment.id}`} variant="secondary" size="sm">
            View report
          </ButtonLink>
        </div>
      </div>

      <Card className="!p-6">
        <h2 className="!text-[1rem]">Submission details</h2>
        <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="Assessment id" value={assessment.id} />
          <Field label="Item bank version" value={assessment.bankVersion} />
          {/* The adaptive walk means there is no fixed total to divide by —
              a child who climbs is asked more questions than one who does not,
              and both are complete. */}
          <Field label="Questions answered" value={String(result?.answeredCount ?? 0)} />
          <Field
            label="Status"
            value={assessment.completedAt ? `Completed ${assessment.completedAt.slice(0, 10)}` : "In progress"}
          />
        </dl>
      </Card>

      {result && (
        <Card className="!p-6">
          <h2 className="!text-[1rem]">Scores by area</h2>
          <div className="mt-5 space-y-4">
            {result.domainScores.map((score) => {
              const domain = DOMAIN_BY_CODE[score.domain];
              const value = score.dq === null ? score.percent * 100 : score.dq;
              return (
                <div key={score.domain}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[0.88rem] font-bold text-ink">{domain.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="tnum text-[0.8rem] text-ink-3">{Math.round(value)}</span>
                      <StatusChip status={score.status} label={STATUSES[score.status].label} />
                    </div>
                  </div>
                  <Meter value={Math.min(100, value)} color={domainColor(score.domain)} className="mt-2" />
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-ink-3">{label}</dt>
      <dd className="mt-0.5 truncate text-[0.88rem] font-semibold text-ink">{value}</dd>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/admin/submissions"
      className="inline-flex items-center gap-1.5 text-[0.85rem] font-semibold text-ink-3 hover:text-ink"
    >
      <IconArrowLeft size={16} /> All submissions
    </Link>
  );
}
