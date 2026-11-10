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
  const [showSwipeHint, setShowSwipeHint] = useState(true);
  const touchStartX = useRef<number | null>(null);

  const orderedScores = [...result.domainScores].sort(
    (a, b) => DOMAIN_BY_CODE[a.domain].order - DOMAIN_BY_CODE[b.domain].order,
  );

  const totalSlides = 9;

  const nextSlide = () => {
    setShowSwipeHint(false);
    setCurrentSlide((curr) => Math.min(totalSlides - 1, curr + 1));
  };

  const prevSlide = () => {
    setShowSwipeHint(false);
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

  // Hide swipe hint automatically after 4.5 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowSwipeHint(false), 4500);
    return () => clearTimeout(timer);
  }, []);

  // Touch gesture support
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    if (diff > 45) {
      nextSlide();
    } else if (diff < -45) {
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
    if (idx === 1) return "6 Competencies Overview";
    if (idx >= 2 && idx <= 7) {
      const score = orderedScores[idx - 2];
      return score ? DOMAIN_BY_CODE[score.domain]?.name : "Competence";
    }
    return "Action Plan & Next Steps";
  };

  return (
    <div
      className="relative w-full max-w-xl mx-auto flex flex-col justify-between select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── Keyframe Animations for Smooth Nudge & Swipe Hint ── */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes subtleNudgeRight {
          0%, 100% { transform: translate(0, -50%); }
          50% { transform: translate(4px, -50%); }
        }
        @keyframes subtleNudgeLeft {
          0%, 100% { transform: translate(0, -50%); }
          50% { transform: translate(-4px, -50%); }
        }
        @keyframes swipeHandMotion {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(-6px); }
        }
        .anim-nudge-right {
          animation: subtleNudgeRight 1.8s ease-in-out infinite;
        }
        .anim-nudge-left {
          animation: subtleNudgeLeft 1.8s ease-in-out infinite;
        }
        .anim-swipe-hand {
          animation: swipeHandMotion 1.4s ease-in-out infinite;
        }
      `}} />

      {/* ── Top Story / Progress Segments ── */}
      <div className="px-1 mb-2.5">
        <div className="flex gap-1.5 items-center w-full">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setShowSwipeHint(false);
                setCurrentSlide(i);
              }}
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
        <div className="flex items-center justify-between mt-2 px-0.5 text-xs text-gray-500 font-semibold">
          <span>
            {currentSlide + 1} of {totalSlides} · {getSlideTitle(currentSlide)}
          </span>
          <span className="text-[11px] font-bold text-[#4D1435] uppercase tracking-wider flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            Swipe or tap arrows
          </span>
        </div>
      </div>

      {/* ── Floating Side Navigation Arrows (Always visible on mobile right at thumb level) ── */}
      {currentSlide > 0 && (
        <button
          type="button"
          onClick={prevSlide}
          aria-label="Previous Section"
          className="anim-nudge-left absolute -left-2 sm:-left-4 top-1/2 z-30 grid size-10 sm:size-11 place-items-center rounded-full bg-white/95 text-gray-800 shadow-xl border border-gray-200 transition-all hover:bg-gray-50 active:scale-90"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
      )}

      {currentSlide < totalSlides - 1 && (
        <button
          type="button"
          onClick={nextSlide}
          aria-label="Next Section"
          className="anim-nudge-right absolute -right-2 sm:-right-4 top-1/2 z-30 grid size-10 sm:size-11 place-items-center rounded-full bg-[#4D1435] text-white shadow-xl border border-[#4D1435] transition-all hover:bg-[#3a0f28] active:scale-90"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      )}

      {/* ── Active Card Container (Auto-sized for mobile viewports) ── */}
      <div className="rounded-3xl border border-gray-200/90 bg-white shadow-xl overflow-hidden p-4 sm:p-6 flex flex-col justify-between min-h-[500px] sm:min-h-[570px] transition-all duration-200">
        
        {/* SLIDE 0: Overall Result */}
        {currentSlide === 0 && (
          <div className="flex-1 flex flex-col justify-between space-y-4">
            <div>
              {/* Animated opening swipe hint */}
              {showSwipeHint && (
                <div className="animate-rise mb-3 flex items-center justify-center gap-2 py-1.5 px-3 rounded-full bg-[#4D1435]/10 border border-[#4D1435]/20 text-xs font-bold text-[#4D1435] mx-auto w-fit">
                  <span className="anim-swipe-hand">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/>
                      <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/>
                      <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/>
                      <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>
                    </svg>
                  </span>
                  <span>Swipe left or tap side arrow to explore</span>
                </div>
              )}

              <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                <div>
                  <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest text-[#4D1435]">
                    Genius Milestone Assessment
                  </span>
                  <h1 className="text-xl sm:text-2xl font-black text-gray-900 mt-0.5">
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
              <div className="mt-4 p-4 rounded-2xl bg-[#4D1435]/5 border border-[#4D1435]/15 flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#4D1435]/80">
                    Overall Developmental Result
                  </span>
                  <p className="text-xl sm:text-2xl font-black text-[#4D1435] mt-0.5">
                    Grade {result.overallStatus.replace(/-/g, "\u2212")}
                  </p>
                  <p className="text-xs font-semibold text-gray-600 mt-0.5">
                    Expected Phase: <strong>Phase {startStage.roman} ({startStage.name})</strong>
                  </p>
                </div>
                <div className="flex flex-col items-center justify-center px-4 py-2.5 rounded-2xl bg-[#4D1435] text-white shadow-md min-w-[80px] shrink-0">
                  <span className="text-2xl sm:text-3xl font-black leading-none">
                    {result.overallStatus.replace(/-/g, "\u2212")}
                  </span>
                  <span className="text-[11px] font-bold mt-1 text-white/90">
                    {overallScoreValue}% DQ
                  </span>
                </div>
              </div>

              {/* Simple Words Highlights with Crisp SVG Icons */}
              <div className="mt-4 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Quick Highlights
                </p>
                <ul className="space-y-2 text-xs sm:text-sm text-gray-800 font-medium">
                  <li className="flex items-start gap-2.5">
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700 mt-0.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </span>
                    <span>
                      <strong>Age &amp; Level:</strong> {ageMonths} months old, matched to Phase {startStage.roman} ({startStage.name}).
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-blue-100 text-blue-700 mt-0.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                      </svg>
                    </span>
                    <span>
                      <strong>Growth Pace:</strong> Scoring {overallScoreValue}% pace across early childhood brain stages.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-purple-100 text-purple-700 mt-0.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                    </span>
                    <span>
                      <strong>Skills Checked:</strong> Vision, hearing, touch, movement, speech, and hand skills all evaluated.
                    </span>
                  </li>
                </ul>
              </div>

              {/* Summary narrative */}
              <div className="mt-4 p-3.5 rounded-xl bg-gray-50 border border-gray-100 text-xs sm:text-sm leading-relaxed text-gray-700 font-medium">
                {overallSummary(result, child)}
              </div>
            </div>

            <div className="text-center pt-1">
              <span className="text-[11px] font-semibold text-gray-400">
                Tap right arrow or swipe left to see the 6 skills spectrum →
              </span>
            </div>
          </div>
        )}

        {/* SLIDE 1: Competencies Spectrum Overview */}
        {currentSlide === 1 && (
          <div className="flex-1 flex flex-col justify-between space-y-3.5">
            <div>
              <div className="border-b border-gray-100 pb-2.5">
                <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest text-[#4D1435]">
                  Overview Chart
                </span>
                <h2 className="text-lg sm:text-xl font-black text-gray-900 mt-0.5">
                  The 6 Core Competencies
                </h2>
                <p className="text-xs font-medium text-gray-500">
                  How {child.name} performs across sensory input and physical expression.
                </p>
              </div>

              {/* List of 6 Competencies */}
              <div className="mt-3 space-y-2">
                {orderedScores.map((score) => {
                  const domain = DOMAIN_BY_CODE[score.domain];
                  const stage = STAGE_BY_ID[score.achievedStage];
                  const gradeCode = STATUSES[score.status].code.replace(/-/g, "\u2212");
                  const percent = Math.round(score.percent * 100);

                  return (
                    <div
                      key={score.domain}
                      className="p-2.5 sm:p-3 rounded-xl border border-gray-100 bg-gray-50/70 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: STAGE_COLORS[stage?.id || "s3"] }}
                        />
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-extrabold text-gray-900 truncate">
                            {domain.name}
                          </p>
                          <p className="text-[11px] text-gray-500 font-medium truncate">
                            {stage?.name ? `Phase ${stage.roman} · ${stage.name}` : "Assessed"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="px-2 py-0.5 rounded-lg bg-[#4D1435] text-white text-[11px] font-extrabold shadow-sm">
                          {gradeCode} · {percent}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Simple Words Learning Connection Tip with Inline SVG Bulb */}
              <div className="mt-3.5 p-3 rounded-xl bg-amber-50/90 border border-amber-200 text-xs text-amber-900 leading-relaxed font-medium flex items-start gap-2">
                <span className="text-amber-600 shrink-0 mt-0.5">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/>
                    <path d="M9 18h6"/>
                    <path d="M10 22h4"/>
                  </svg>
                </span>
                <span>
                  <strong>How brain growth connects:</strong> Senses taking information in (eyes, ears, touch) directly empower action skills (crawling/walking, speaking, using hands).
                </span>
              </div>
            </div>

            <div className="text-center pt-1">
              <span className="text-[11px] font-semibold text-gray-400">
                Tap right arrow to view each competence in detail →
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
            <div className="flex-1 flex flex-col justify-between space-y-3.5">
              <div>
                {/* Header: Roman Numeral, Title, and Clean Aligned Grade Badge */}
                <div className="flex items-center justify-between gap-3 border-b border-[#4D1435] pb-2.5">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest text-[#4D1435]">
                      Competence {romanDomain} of VI
                    </span>
                    <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-[#4D1435] truncate mt-0.5">
                      {domain.name}
                    </h2>
                  </div>

                  {/* High-visibility Grade Badge - Never Masked */}
                  <div className="flex flex-col items-center justify-center px-3 py-1 rounded-xl border-2 border-[#4D1435] bg-[#4D1435] text-white shadow-md shrink-0">
                    <span className="text-base sm:text-lg font-black tracking-tight leading-none">
                      {gradeCode}
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-bold mt-0.5 text-white/90">
                      {percent}%
                    </span>
                  </div>
                </div>

                {/* Achieved Brain Stage Pill */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold text-white shadow-sm"
                    style={{ backgroundColor: STAGE_COLORS[achievedStage?.id || "s3"] }}
                  >
                    Phase {achievedStage?.roman || "III"}: {achievedStage?.name || "Mid-Brain"}
                  </span>
                  <span className="text-[11px] text-gray-500 font-semibold">
                    Expected: Phase {startStage.roman}
                  </span>
                </div>

                {/* Key Highlights in Plain, Everyday Words with Clean SVGs */}
                <div className="mt-3 p-3 rounded-2xl bg-gray-50 border border-gray-100">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                    Key Highlights
                  </p>
                  <ul className="space-y-1.5 text-xs sm:text-sm text-gray-800 font-medium">
                    {cell?.description && (
                      <li className="flex items-start gap-2">
                        <span className="grid size-4 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700 mt-0.5">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        </span>
                        <span>
                          <strong>What {child.name} can do now:</strong> {cell.description}
                        </span>
                      </li>
                    )}
                    <li className="flex items-start gap-2">
                      <span className="grid size-4 shrink-0 place-items-center rounded-full bg-blue-100 text-blue-700 mt-0.5">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                        </svg>
                      </span>
                      <span>
                        <strong>Performance Result:</strong> Grade {gradeCode} ({percent}% pace for age).
                      </span>
                    </li>
                  </ul>
                </div>

                {/* Clinical Summary */}
                <div className="mt-3">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#4D1435] mb-1">
                    Summary:
                  </h3>
                  <div className="text-xs sm:text-sm leading-relaxed text-gray-700 font-medium">
                    {domainNote(score, child)}
                  </div>
                </div>

                {/* Milestone Video Recommendation Row */}
                <div className="mt-3">
                  <MilestoneVideoRow
                    stageId={score.achievedStage}
                    domain={score.domain}
                    domainName={domain.name}
                  />
                </div>
              </div>

              <div className="text-center pt-1">
                <span className="text-[11px] font-semibold text-gray-400">
                  {currentSlide < 7 ? "Tap right arrow to see next competence →" : "Tap right arrow to see Action Plan →"}
                </span>
              </div>
            </div>
          );
        })()}

        {/* SLIDE 8: ECCTRACTION Action Plan & Course Recommendation */}
        {currentSlide === 8 && (
          <div className="flex-1 flex flex-col justify-between space-y-3.5">
            <div>
              <div className="border-b border-[#4D1435] pb-2.5">
                <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest text-[#4D1435]">
                  Final Recommendation
                </span>
                <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight text-[#4D1435] mt-0.5">
                  The ECCTRACTION Plan
                </h2>
              </div>

              <div className="mt-3 p-3.5 rounded-2xl bg-[#4D1435]/5 border border-[#4D1435]/15">
                <p className="text-xs sm:text-sm leading-relaxed text-gray-800 font-medium">
                  <span className="font-bold underline text-[#4D1435]">{child.name}</span> needs to join{" "}
                  <strong className="text-[#4D1435]">Phase {startStage.roman} Course</strong> of the KGKP for further enhancement of his/her Competencies to raise the IQ. Please use the link below to explore the Course to help you make a decision to continue further.
                </p>
              </div>

              {/* The CourseRow component praised by the user */}
              <div className="mt-3">
                <CourseRow stageId={startStage.id} childName={child.name} />
              </div>

              {/* Disclaimer */}
              <div className="mt-3 p-3 rounded-xl bg-gray-50 border border-gray-100 text-[10px] sm:text-[11px] leading-relaxed text-gray-500">
                <strong className="text-gray-700">Disclaimer:</strong> {getDisclaimer()}
              </div>
            </div>

            <div className="text-center pt-1">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                You have reviewed the complete ECCTRACTION Plan
              </span>
            </div>
          </div>
        )}

        {/* ── Bottom Slider Navigation Bar ── */}
        <div className="border-t border-gray-100 pt-3 mt-3 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 transition-colors disabled:opacity-30 disabled:pointer-events-none hover:bg-gray-100"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            <span>Previous</span>
          </button>

          <div className="text-xs font-bold text-gray-500 tnum">
            {currentSlide + 1} / {totalSlides}
          </div>

          <button
            type="button"
            onClick={nextSlide}
            disabled={currentSlide === totalSlides - 1}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#4D1435] text-white text-xs font-bold shadow-md transition-colors disabled:opacity-30 disabled:pointer-events-none hover:bg-[#3a0f28]"
          >
            <span>Next</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
