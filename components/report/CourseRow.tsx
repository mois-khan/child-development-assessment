"use client";

import { useEffect, useState } from "react";
import type { CourseRecommendation } from "@/lib/types/recommendations";
import { getCourseRecommendations } from "@/lib/data/course-recommendations";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { STAGE_BY_ID } from "@/content/stages";

interface CourseRowProps {
  stageId: string;    // the child's overall start stage id
  childName: string;  // for personalizing the CTA
}

const DEMO_URL = "https://www.kaushalyageniuskid.com/demo";

export function CourseRow({ stageId, childName }: CourseRowProps) {
  const [courses, setCourses] = useState<CourseRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    getCourseRecommendations(stageId)
      .then((data) => {
        if (active) {
          setCourses(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch course recommendations:", err);
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [stageId]);

  if (loading || courses.length === 0) {
    // Still show the demo CTA even if no courses found in DB
    return <FallbackCta stageId={stageId} childName={childName} />;
  }

  return (
    <div className="mt-6 flex flex-col gap-4">
      {courses.map(course => (
        <CourseCard key={course.id} course={course} childName={childName} />
      ))}
    </div>
  );
}

function CourseCard({ course, childName }: { course: CourseRecommendation; childName: string }) {
  const stage = STAGE_BY_ID[course.stage_id];
  const courseUrl = course.redirect_url || "https://www.kaushalyageniuskid.com";
  const demoUrl = `${DEMO_URL}?phase=${stage?.roman ?? ""}`;

  return (
    <div className="rounded-2xl border-2 border-[#4D1435]/20 overflow-hidden bg-white shadow-sm">
      <div className="flex">
        {/* Thumbnail */}
        <div className="w-[140px] shrink-0 min-h-[130px] bg-[#4D1435]/10 relative overflow-hidden">
          {course.thumbnail_url ? (
            <img
              src={course.thumbnail_url}
              alt={course.title}
              className="w-full h-full object-cover absolute inset-0"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center p-3 text-center text-[#4D1435]">
              <span className="text-4xl mb-1">📚</span>
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">Phase {stage?.roman}</span>
              <span className="mt-0.5 text-xs font-extrabold leading-tight">
                {course.age_label || `${stage?.averageMonths} mo`}
              </span>
            </div>
          )}
          {/* Phase badge overlay */}
          <div className="absolute top-2 left-2 bg-[#4D1435] text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
            Phase {stage?.roman}
          </div>
        </div>

        {/* Course details */}
        <div className="flex-1 p-4 flex flex-col gap-2">
          <div>
            {course.age_label && (
              <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FDF2F8] text-[#4D1435] mb-1.5">
                {course.age_label}
              </span>
            )}
            <h4 className="text-base font-extrabold text-[#4D1435] leading-snug">{course.title}</h4>
            {course.subtitle && (
              <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">{course.subtitle}</p>
            )}
          </div>

          {/* CTAs */}
          <div className="mt-auto pt-3 flex items-center gap-2 flex-wrap">
            {/* Primary: Demo — highlighted in gold/sun colour */}
            <a
              href={demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#F4A93B] px-4 py-2 text-xs font-extrabold text-[#4D1435] border-2 border-[#E8971F] hover:bg-[#E8971F] transition-colors text-center shadow-sm"
            >
              <span>🎁</span>
              7-Day Free Demo
            </a>
            {/* Secondary: Explore */}
            <a
              href={courseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex flex-1 items-center justify-center rounded-lg border-2 border-[#4D1435] px-4 py-2 text-xs font-bold text-[#4D1435] hover:bg-[#4D1435] hover:text-white transition-colors text-center"
            >
              Explore Course
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Shown when no courses exist in DB — ensures the CTA never disappears */
function FallbackCta({ stageId, childName }: { stageId: string; childName: string }) {
  const stage = STAGE_BY_ID[stageId];
  const demoUrl = `${DEMO_URL}?phase=${stage?.roman ?? ""}`;
  return (
    <div className="mt-4 rounded-2xl border-2 border-[#4D1435]/20 p-6 bg-gradient-to-br from-[#4D1435]/5 to-transparent flex flex-col gap-3">
      <div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#4D1435]/60">Recommended</span>
        <h4 className="text-base font-extrabold text-[#4D1435] mt-0.5">
          Phase {stage?.roman} — KGKP Course
        </h4>
        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
          Designed for children at {childName}'s stage. Structured activities to accelerate development across all 6 competencies.
        </p>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <a
          href={demoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#F4A93B] px-4 py-2 text-xs font-extrabold text-[#4D1435] border-2 border-[#E8971F] hover:bg-[#E8971F] transition-colors text-center shadow-sm"
        >
          <span>🎁</span>
          7-Day Free Demo
        </a>
        <a
          href="https://www.kaushalyageniuskid.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex flex-1 items-center justify-center rounded-lg border-2 border-[#4D1435] px-4 py-2 text-xs font-bold text-[#4D1435] hover:bg-[#4D1435] hover:text-white transition-colors text-center"
        >
          Explore Course
        </a>
      </div>
    </div>
  );
}
