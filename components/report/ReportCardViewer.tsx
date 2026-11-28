"use client";

import { DOMAIN_BY_CODE } from "@/content/domains";
import { STAGE_BY_ID } from "@/content/stages";
import { overallSummary } from "@/lib/narrative";
import { STATUSES } from "@/lib/scoring";
import type { AssessmentResult, BrainStage, Child, DomainScore } from "@/lib/types";
import { MilestoneVideoRow } from "@/components/report/MilestoneVideoRow";
import { formatExactAge } from "@/lib/age";

type Tone = "ahead" | "onTrack" | "support";

function toneFor(score: DomainScore): Tone {
  if (score.status === "A++" || score.status === "A+") return "ahead";
  if (score.status === "A") return "onTrack";
  return "support";
}

const TONE_STYLES: Record<Tone, { label: string; card: string; badge: string; dot: string }> = {
  ahead: { label: "Ahead", card: "border-emerald-200 bg-emerald-50/70", badge: "bg-emerald-600 text-white", dot: "bg-emerald-500" },
  onTrack: { label: "On track", card: "border-amber-200 bg-amber-50/70", badge: "bg-amber-500 text-white", dot: "bg-amber-500" },
  support: { label: "Needs support", card: "border-rose-200 bg-rose-50/70", badge: "bg-rose-600 text-white", dot: "bg-rose-500" },
};

function SheetIcon() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><path d="M8 13h8M8 17h6" /></svg>;
}

function ShareIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>;
}

function DownloadIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>;
}

export function ReportCardViewer({
  child,
  result,
  startStage,
  ageExactMonths,
  onShare,
  onDownload,
  onViewSheet,
  copied = false,
}: {
  child: Child;
  result: AssessmentResult;
  startStage: BrainStage;
  ageExactMonths: number;
  onShare: () => void;
  onDownload: () => void;
  onViewSheet: () => void;
  copied?: boolean;
}) {
  const scores = [...result.domainScores].sort((a, b) => DOMAIN_BY_CODE[a.domain].order - DOMAIN_BY_CODE[b.domain].order);
  const supportScores = scores.filter((score) => score.percent < 1);
  const overall = result.overallDq ?? 0;
  const overallStatus = STATUSES[result.overallStatus];

  return (
    <section className="mx-auto w-full max-w-5xl">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_16px_40px_rgba(35,24,39,0.10)]">
        <header className="border-b border-slate-100 bg-gradient-to-br from-[#4D1435] to-[#751d50] px-5 py-5 text-white sm:px-8 sm:py-7">
          <div className="flex flex-col gap-3 min-[400px]:flex-row min-[400px]:items-start min-[400px]:justify-between min-[400px]:gap-4">
            <div className="min-w-0"><p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-white/70">Development snapshot</p><h1 className="mt-1 break-words text-2xl font-black leading-tight tracking-tight sm:text-3xl">{child.name}&rsquo;s ECCTRACTION Plan</h1><p className="mt-2 text-sm font-semibold text-white/80">{formatExactAge(ageExactMonths)} · Expected phase {startStage.roman}</p></div>
            <div className="shrink-0 rounded-2xl bg-white px-3.5 py-2.5 text-center text-[#4D1435] shadow-lg"><p className="text-2xl font-black leading-none">{overallStatus.code.replace(/-/g, "−")}</p><p className="mt-1 text-xs font-extrabold">{Math.round(overall)}%</p></div>
          </div>
        </header>

        <div className="p-4 sm:p-7">
          <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-[1fr_auto] sm:items-center sm:px-5"><div><p className="text-xs font-extrabold uppercase tracking-[0.13em] text-slate-500">Overall result</p><p className="mt-1 text-base font-black leading-relaxed text-slate-950 sm:text-lg">{overallSummary(result, child)}</p></div><span className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm ring-1 ring-slate-200"><span className="size-2 rounded-full bg-[#4D1435]" /> {overallStatus.label}</span></div>

          <div className="mt-6 flex flex-col gap-1 min-[400px]:flex-row min-[400px]:items-center min-[400px]:justify-between min-[400px]:gap-3"><div><h2 className="text-base font-black text-slate-950">Six competencies</h2><p className="mt-0.5 text-xs font-medium text-slate-500">Green is ahead, amber is on track, red needs support.</p></div><span className="whitespace-nowrap text-xs font-bold text-slate-500">Score for age</span></div>
          <div className="mt-3 grid grid-cols-1 gap-2.5 min-[400px]:grid-cols-2 sm:grid-cols-3 sm:gap-3">
            {scores.map((score) => {
              const domain = DOMAIN_BY_CODE[score.domain];
              const stage = STAGE_BY_ID[score.achievedStage];
              const tone = TONE_STYLES[toneFor(score)];
              const percent = Math.round(score.percent * 100);
              return <article key={score.domain} className={`rounded-2xl border p-3 sm:p-4 ${tone.card}`}><div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate text-sm font-extrabold text-slate-950">{domain.short}</p><p className="mt-0.5 truncate text-[11px] font-semibold text-slate-500">Phase {stage?.roman ?? startStage.roman}</p></div><span className={`shrink-0 rounded-lg px-1.5 py-1 text-[11px] font-black ${tone.badge}`}>{STATUSES[score.status].code.replace(/-/g, "−")}</span></div><div className="mt-4 flex items-end justify-between gap-2"><p className="text-2xl font-black leading-none text-slate-950">{percent}%</p><span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600"><span className={`size-1.5 rounded-full ${tone.dot}`} />{tone.label}</span></div></article>;
            })}
          </div>

          <div className="mt-4"><button type="button" onClick={onViewSheet} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#4D1435] px-4 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#3a0f28] sm:w-fit"><SheetIcon /> View detailed report</button></div>

          {supportScores.length > 0 && <section className="mt-6 rounded-2xl border border-rose-200 bg-rose-50/60 p-4 sm:p-5"><div className="flex items-start gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-xl bg-rose-600 text-sm font-black text-white">!</span><div><h2 className="text-sm font-black text-rose-950">Suggested support</h2><p className="mt-0.5 text-xs font-medium leading-relaxed text-rose-900/75">Activities are available only for competencies that are still below the age expectation.</p></div></div><div className="mt-3 divide-y divide-rose-200/80">{supportScores.map((score) => <div key={score.domain} className="py-2 first:pt-0 last:pb-0"><MilestoneVideoRow stageId={score.achievedStage} domain={score.domain} domainName={DOMAIN_BY_CODE[score.domain].name} /></div>)}</div></section>}

          <div className="mt-6 grid gap-2 sm:grid-cols-2"><button type="button" onClick={onDownload} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-extrabold text-slate-800 transition hover:bg-slate-50"><DownloadIcon /> Save as PDF</button><button type="button" onClick={onShare} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-extrabold text-slate-800 transition hover:bg-slate-50"><ShareIcon /> {copied ? "Link copied" : "Share report"}</button></div>
          <p className="mt-2 text-center text-[11px] font-medium text-slate-500">Use “Save as PDF” in your browser&rsquo;s print screen to keep a copy.</p>
        </div>
      </div>
    </section>
  );
}
