"use client";

import { useEffect, useState } from "react";
import type { CourseRecommendation } from "@/lib/types/recommendations";
import { getCourseRecommendations } from "@/lib/data/course-recommendations";
import { isSupabaseConfigured } from "@/lib/supabase/env";

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
      <h3 className="text-lg font-bold text-ink">
        Courses matched to {childName}&apos;s development
      </h3>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {courses.map(course => <CourseCard key={course.id} course={course} />)}
      </div>
      <a
        href="https://www.kaushalyageniuskid.com"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-[var(--accent)] hover:underline"
      >
        View all courses at KaushalyaGeniusKids.com →
      </a>
    </div>
  );
}

function CourseCard({ course }: { course: CourseRecommendation }) {
  return (
    <div className="rounded-[var(--radius-sm)] bg-[var(--surface-2)] overflow-hidden flex h-full">
      <div className="w-24 shrink-0 h-full min-h-[96px] bg-[var(--surface-3)]">
        {course.thumbnail_url ? (
          <img 
            src={course.thumbnail_url} 
            alt={course.title} 
            className="w-full h-full object-cover" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">
            🎓
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col gap-1 flex-1">
        {course.age_label && (
          <span className="self-start text-2xs font-bold px-2 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
            {course.age_label}
          </span>
        )}
        <h4 className="text-base font-extrabold text-ink leading-snug">{course.title}</h4>
        {course.subtitle && (
          <p className="text-xs text-ink-2 line-clamp-2">{course.subtitle}</p>
        )}
        <div className="mt-auto pt-2">
          <a
            href={course.redirect_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-bold text-[var(--accent)] hover:underline"
          >
            Explore →
          </a>
        </div>
      </div>
    </div>
  );
}
