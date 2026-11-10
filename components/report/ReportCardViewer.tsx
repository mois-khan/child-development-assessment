"use client";

import { useEffect, useRef, useState } from "react";
import { DOMAIN_BY_CODE } from "@/content/domains";
import { BRAIN_STAGES, STAGE_BY_ID, cellFor } from "@/content/stages";
import { domainNote, overallSummary, getDisclaimer } from "@/lib/narrative";
import { STATUSES } from "@/lib/scoring";
import type { AssessmentResult, BrainStage, Child, DomainCode, DomainScore } from "@/lib/types";
import { MilestoneVideoRow } from "@/components/report/MilestoneVideoRow";
import { CourseRow } from "@/components/report/CourseRow";

const STAGE_COLORS: Record<string, string> = {
  s1: "#EF4444",
  s2: "#F97316",
  s3: "#F59E0B",
  s4: "#22C55E",
  s5: "#0EA5E9",
  s6a: "#6366F1",
  s6b: "#6366F1",
  s7a: "#A855F7",
  s7b: "#A855F7",
};

export function ReportCardViewer({
  child,
  result,
  startStage,
  ageMonths,
  onShare,
  onDownload,
  copied = false,
}: {
  child: Child;
  result: AssessmentResult;
  startStage: BrainStage;
  ageMonths: number;
  onShare: () => void;
  onDownload: () => void;
  copied?: boolean;
}) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const orderedScores = [...result.domainScores].sort(
    (a, b) => DOMAIN_BY_CODE[a.domain].order - DOMAIN_BY_CODE[b.domain].order,
  );

  // Total 9 slides:
  // Slide 0: Executive Summary & Overall Result
  // Slide 1: 6 Competencies Spectrum Overview
  // Slides 2–7: Individual Competences (Visual, Auditory, Tactile, Mobility, Language, Manual)
  // Slide 8: The ECCTRACTION Action Plan & Course Recommendation
  const totalSlides = 9;

  const nextSlide = () => {
    setCurrentSlide((curr) => Math.min(totalSlides - 1, curr + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((curr) => Math.max(0, curr - 1));
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") nextSlide();
      if (e.key === "ArrowLeft") prevSlide();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Touch gesture support
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    if (diff > 50) {
      nextSlide();
    } else if (diff < -50) {
      prevSlide();
    }
    touchStartX.current = null;
  };

  const overallScoreValue =
    result.overallDq !== null
      ? Math.round(result.overallDq)
      : Math.round(
          result.domainScores.reduce((acc, d) => acc + d.percent * 100, 0) / 6,
        );

  const getSlideTitle = (idx: number) => {
    if (idx === 0) return "Executive Summary";
    if (idx === 1) return "Competencies Spectrum";
    if (idx >= 2 && idx <= 7) {
      const score = orderedScores[idx - 2];
      return score ? DOMAIN_BY_CODE[score.domain]?.name : "Competence";
    }
    return "Action Plan & Next Steps";
  };

  return (
    <div
      className="w-full max-w-xl mx-auto flex flex-col justify-between select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── Top Story / Progress Segments ── */}
      <div className="px-1 mb-3">
        <div className="flex gap-1.5 items-center w-full">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrentSlide(i)}
              className="h-1.5 rounded-full flex-1 transition-all duration-300"
              style={{
                backgroundColor: i <= currentSlide ? "#4D1435" : "#e5e7eb",
                opacity: i === currentSlide ? 1 : i < currentSlide ? 0.7 : 0.4,
              }}
              title={`Go to slide ${i + 1}`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
        <div className="flex items-center justify-between mt-2.5 px-0.5 text-xs text-gray-500 font-semibold">
          <span>
            {currentSlide + 1} of {totalSlides} · {getSlideTitle(currentSlide)}
          </span>
          <span className="text-[11px] font-bold text-[#4D1435] uppercase tracking-wider">
            Swipe or use arrows
          </span>
        </div>
      </div>

      {/* ── The Active Card Container ── */}
      <div className="rounded-3xl border border-gray-200/90 bg-white shadow-xl overflow-hidden p-5 sm:p-7 flex flex-col justify-between min-h-[560px] sm:min-h-[620px] transition-all duration-200">
        {/* SLIDE 0: Overall Result */}
        {currentSlide === 0 && (
          <div className="flex-1 flex flex-col justify-between space-y-5">
            <div>
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#4D1435]">
                    Genius Milestone Assessment
                  </span>
                  <h1 className="text-2xl font-black text-gray-900 mt-0.5">
                    {child.name}&rsquo;s ECCTRACTION Plan
                  </h1>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-gray-500 block">Age</span>
                  <span className="text-sm font-extrabold text-gray-800">
                    {ageMonths} Months
                  </span>
                </div>
              </div>

              {/* Big Overall Grade Hero */}
              <div className="mt-5 p-5 rounded-2xl bg-[#4D1435]/5 border border-[#4D1435]/15 flex items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#4D1435]/80">
                    Overall Development Status
                  </span>
                  <p className="text-xl sm:text-2xl font-black text-[#4D1435] mt-0.5">
                    Grade {result.overallStatus.replace(/-/g, "\u2212")}
                  </p>
                  <p className="text-xs font-semibold text-gray-600 mt-1">
                    Expected Phase: <strong>Phase {startStage.roman} ({startStage.name})</strong>
                  </p>
                </div>
                <div className="flex flex-col items-center justify-center px-4 py-3 rounded-2xl bg-[#4D1435] text-white shadow-lg min-w-[85px] shrink-0">
                  <span className="text-3xl font-black leading-none">
                    {result.overallStatus.replace(/-/g, "\u2212")}
                  </span>
                  <span className="text-xs font-bold mt-1 text-white/90">
                    {overallScoreValue}% DQ
                  </span>
                </div>
              </div>

              {/* India Today Style Bullet Points */}
              <div className="mt-5 space-y-2.5">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Key Takeaways
                </p>
                <ul className="space-y-2 text-sm text-gray-800 font-medium">
                  <li className="flex items-start gap-2.5">
                    <span className="text-emerald-600 font-bold mt-0.5">•</span>
                    <span>
                      <strong>Age Bracket:</strong> Assessed at <strong>{ageMonths} months</strong>, corresponding to starting <strong>Phase {startStage.roman}</strong>.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-emerald-600 font-bold mt-0.5">•</span>
                    <span>
                      <strong>Developmental Quotient:</strong> Achieved an overall developmental pace of <strong>{overallScoreValue}%</strong>.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-emerald-600 font-bold mt-0.5">•</span>
                    <span>
                      <strong>Clinical Evaluation:</strong> All 6 sensory and motor competencies successfully mapped.
                    </span>
                  </li>
                </ul>
              </div>

              {/* Summary paragraph with generous line height */}
              <div className="mt-5 p-4 rounded-xl bg-gray-50 border border-gray-100">
                <p className="text-sm leading-relaxed text-gray-700 font-medium">
                  {overallSummary(result, child)}
                </p>
              </div>
            </div>

            <div className="text-center pt-2">
              <span className="text-xs font-semibold text-gray-400">
                Swipe left or tap Next to view the 6 competences spectrum →
              </span>
            </div>
          </div>
        )}

        {/* SLIDE 1: Competencies Spectrum Overview */}
        {currentSlide === 1 && (
          <div className="flex-1 flex flex-col justify-between space-y-4">
            <div>
              <div className="border-b border-gray-100 pb-3">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#4D1435]">
                  Overview Chart
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 mt-0.5">
                  The 6 Core Competencies
                </h2>
                <p className="text-xs font-medium text-gray-500 mt-1">
                  How {child.name} performs across sensory intake and functional expression.
                </p>
              </div>

              {/* List of 6 Competencies */}
              <div className="mt-4 space-y-2.5">
                {orderedScores.map((score) => {
                  const domain = DOMAIN_BY_CODE[score.domain];
                  const stage = STAGE_BY_ID[score.achievedStage];
                  const gradeCode = STATUSES[score.status].code.replace(/-/g, "\u2212");
                  const percent = Math.round(score.percent * 100);

                  return (
                    <div
                      key={score.domain}
                      className="p-3 sm:p-3.5 rounded-xl border border-gray-100 bg-gray-50/70 flex items-center justify-between gap-3 transition-colors hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: STAGE_COLORS[stage?.id || "s3"] }}
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-extrabold text-gray-900 truncate">
                            {domain.name}
                          </p>
                          <p className="text-xs text-gray-500 font-medium truncate">
                            {stage?.name ? `Phase ${stage.roman} · ${stage.name}` : "Assessed"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2.5 py-1 rounded-lg bg-[#4D1435] text-white text-xs font-extrabold shadow-sm">
                          {gradeCode} · {percent}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/60 text-xs text-amber-900 leading-relaxed font-medium">
                💡 <strong>Tip:</strong> Senses that absorb information (Visual, Auditory, Tactile) directly build the foundation for expressive skills (Mobility, Language, Manual).
              </div>
            </div>

            <div className="text-center pt-2">
              <span className="text-xs font-semibold text-gray-400">
                Swipe left to view each individual competence in detail →
              </span>
            </div>
          </div>
        )}

        {/* SLIDES 2 to 7: Individual Competences */}
        {currentSlide >= 2 && currentSlide <= 7 && (() => {
          const score = orderedScores[currentSlide - 2];
          if (!score) return null;
          const domain = DOMAIN_BY_CODE[score.domain];
          const achievedStage = STAGE_BY_ID[score.achievedStage];
          const gradeCode = STATUSES[score.status].code.replace(/-/g, "\u2212");
          const percent = Math.round(score.percent * 100);
          const romanDomain = ["I", "II", "III", "IV", "V", "VI"][domain.order - 1];
          const cell = cellFor(achievedStage?.id || "s3", score.domain as any);

          return (
            <div className="flex-1 flex flex-col justify-between space-y-4">
              <div>
                {/* Header: Roman Numeral, Title, and Clean Aligned Grade Badge */}
                <div className="flex items-center justify-between gap-3 border-b border-[#4D1435] pb-3">
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#4D1435]">
                      Competence {romanDomain} of VI
                    </span>
                    <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight text-[#4D1435] truncate mt-0.5">
                      {domain.name}
                    </h2>
                  </div>

                  {/* High-visibility Grade Badge - Never Masked */}
                  <div className="flex flex-col items-center justify-center px-3.5 py-1.5 rounded-xl border-2 border-[#4D1435] bg-[#4D1435] text-white shadow-md shrink-0">
                    <span className="text-base sm:text-lg font-black tracking-tight leading-none">
                      {gradeCode}
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-bold mt-0.5 text-white/90">
                      {percent}%
                    </span>
                  </div>
                </div>

                {/* Achieved Brain Stage Pill */}
                <div className="mt-3.5 flex flex-wrap items-center gap-2">
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm"
                    style={{ backgroundColor: STAGE_COLORS[achievedStage?.id || "s3"] }}
                  >
                    Phase {achievedStage?.roman || "III"}: {achievedStage?.name || "Mid-Brain"}
                  </span>
                  <span className="text-xs text-gray-500 font-semibold">
                    Expected: Phase {startStage.roman}
                  </span>
                </div>

                {/* India Today style summary bullet points */}
                <div className="mt-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                    Milestone Highlights
                  </p>
                  <ul className="space-y-1.5 text-xs sm:text-sm text-gray-800 font-medium">
                    {cell?.description && (
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                        <span>
                          <strong>Achieved Skill:</strong> {cell.description}
                        </span>
                      </li>
                    )}
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold mt-0.5">ℹ</span>
                      <span>
                        <strong>Developmental Status:</strong> Scored <strong>{percent}%</strong> in this competence.
                      </span>
                    </li>
                  </ul>
                </div>

                {/* Narrative Summary */}
                <div className="mt-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#4D1435] mb-1.5">
                    Clinical Summary:
                  </h3>
                  <div className="text-xs sm:text-sm leading-relaxed text-gray-700 font-medium">
                    {domainNote(score, child)}
                  </div>
                </div>

                {/* Milestone Video Recommendation Row */}
                <div className="mt-4">
                  <MilestoneVideoRow
                    stageId={score.achievedStage}
                    domain={score.domain}
                    domainName={domain.name}
                  />
                </div>
              </div>

              <div className="text-center pt-2">
                <span className="text-xs font-semibold text-gray-400">
                  {currentSlide < 7 ? "Swipe left to next competence →" : "Swipe left to view Action Plan →"}
                </span>
              </div>
            </div>
          );
        })()}

        {/* SLIDE 8: ECCTRACTION Action Plan & Course Recommendation */}
        {currentSlide === 8 && (
          <div className="flex-1 flex flex-col justify-between space-y-4">
            <div>
              <div className="border-b border-[#4D1435] pb-3">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#4D1435]">
                  Final Recommendation
                </span>
                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-[#4D1435] mt-0.5">
                  The ECCTRACTION Plan
                </h2>
              </div>

              <div className="mt-4 p-4 rounded-2xl bg-[#4D1435]/5 border border-[#4D1435]/15">
                <p className="text-sm sm:text-base leading-relaxed text-gray-800 font-medium">
                  <span className="font-bold underline text-[#4D1435]">{child.name}</span> needs to join{" "}
                  <strong className="text-[#4D1435]">Phase {startStage.roman} Course</strong> of the KGKP for further enhancement of his/her Competencies to raise the IQ. Please use the link below to explore the Course to help you make a decision to continue further.
                </p>
              </div>

              {/* The CourseRow component praised by the user */}
              <div className="mt-4">
                <CourseRow stageId={startStage.id} childName={child.name} />
              </div>

              {/* Disclaimer */}
              <div className="mt-5 p-3.5 rounded-xl bg-gray-50 border border-gray-100 text-[11px] leading-relaxed text-gray-500">
                <strong className="text-gray-700">Disclaimer:</strong> {getDisclaimer()}
              </div>
            </div>

            <div className="text-center pt-2">
              <span className="text-xs font-bold text-emerald-700">
                ✓ You have reviewed the complete ECCTRACTION Plan
              </span>
            </div>
          </div>
        )}

        {/* ── Bottom Slider Navigation Bar ── */}
        <div className="border-t border-gray-100 pt-4 mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm font-bold text-gray-700 transition-colors disabled:opacity-30 disabled:pointer-events-none hover:bg-gray-100"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            <span>Previous</span>
          </button>

          <div className="text-xs font-bold text-gray-500 tnum">
            {currentSlide + 1} / {totalSlides}
          </div>

          <button
            type="button"
            onClick={nextSlide}
            disabled={currentSlide === totalSlides - 1}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#4D1435] text-white text-xs sm:text-sm font-bold shadow-md transition-colors disabled:opacity-30 disabled:pointer-events-none hover:bg-[#3a0f28]"
          >
            <span>Next</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
