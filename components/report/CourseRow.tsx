"use client";

import { useEffect, useState } from "react";
import type { CourseRecommendation } from "@/lib/types/recommendations";
import { getCourseRecommendations } from "@/lib/data/course-recommendations";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { STAGE_BY_ID } from "@/content/stages";

interface CourseRowProps {
  stageId: string;    // the child's overall achieved stage id
  childName: string;  // for personalizing the heading
}

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
    return null;
  }

  return (
    <div className="mt-8 border-t border-line-soft pt-6 no-print">
      <p className="eyebrow mb-1">📚 Recommended Courses</p>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {courses.map(course => <CourseCard key={course.id} course={course} />)}
      </div>
      
    </div>
  );
}

function CourseCard({ course }: { course: CourseRecommendation }) {
  const stage = STAGE_BY_ID[course.stage_id];
  return (
    <div className="rounded-[0.5rem] bg-[white] overflow-hidden flex h-full border border-line-soft shadow-sm hover:shadow transition-shadow">
      <div className="w-1/3 min-w-[120px] max-w-[160px] shrink-0 h-full min-h-[120px] bg-[#F3F4F6]">
        {course.thumbnail_url ? (
          <img 
            src={course.thumbnail_url} 
            alt={course.title} 
            className="w-full h-full object-cover" 
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-[#4D1435]/10 p-2 text-center shadow-inner text-[#4D1435]">
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">Phase {stage?.roman}</span>
            <span className="mt-0.5 text-xs font-extrabold leading-tight">
              {course.age_label || `${stage?.averageMonths} mo`}
            </span>
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col gap-1 flex-1">
        {course.age_label && (
          <span className="self-start text-2xs font-bold px-2 py-0.5 rounded-full bg-[#FDF2F8] text-[#4D1435] mb-1">
            {course.age_label}
          </span>
        )}
        <h4 className="text-base font-extrabold text-ink leading-snug">{course.title}</h4>
        {course.subtitle && (
          <p className="text-xs text-ink-2 line-clamp-2">{course.subtitle}</p>
        )}
        <div className="mt-auto pt-3 flex items-center gap-2">
          <a
            href={course.redirect_url || "https://www.kaushalyageniuskid.com/demo"}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-1 items-center justify-center rounded-md bg-[#4D1435] px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[#4D1435]/90 text-center"
          >
            Explore Course
          </a>
          <a
            href={course.redirect_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-1 items-center justify-center rounded-md border border-[#4D1435] bg-transparent px-3 py-1.5 text-xs font-bold text-[#4D1435] transition-colors hover:bg-[#4D1435]/5 text-center"
          >
            Explore
          </a>
        </div>
      </div>
    </div>
  );
}
