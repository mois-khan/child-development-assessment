"use client";

import { useEffect, useState } from "react";
import type { CourseRecommendation } from "@/lib/types/recommendations";
import { getCourseRecommendations } from "@/lib/data/course-recommendations";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { STAGE_BY_ID } from "@/content/stages";

interface CourseRowProps {
  stageId: string;
  childName: string;
}

const DEMO_URL = "https://www.kaushalyageniuskid.com/demo";

// Modern sleek SVG Icons
function SparklesIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
  );
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

  if (loading) {
    return <div className="h-[180px] w-full rounded-2xl bg-gray-100 animate-pulse border border-gray-200 mt-2" />;
  }

  if (courses.length === 0) {
    return <FallbackCta stageId={stageId} childName={childName} />;
  }

  return (
    <div className="flex flex-col gap-5 items-center w-full mt-4 mb-2">
      {courses.map(course => (
        <CourseCard key={course.id} course={course} childName={childName} />
      ))}
    </div>
  );
}

function CourseCard({ course, childName }: { course: CourseRecommendation; childName: string }) {
  const stage = STAGE_BY_ID[course.stage_id];
  const courseUrl = course.redirect_url || "https://www.kaushalyageniuskid.com";
  const demoUrl = course.demo_url || `${DEMO_URL}?phase=${stage?.roman ?? ""}`;
  
  // Sharp QR edge generation: pure square, colored dynamically to match accent.
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(demoUrl)}&color=4D1435&bgcolor=FFFFFF&margin=0`;

  return (
    <div className="w-full rounded-2xl overflow-hidden shadow-md flex flex-col md:flex-row group relative bg-[#F4A93B] border-[2px] border-[#4D1435]/10">
      
      {/* Background Graphic Accent (Very subtle white bloom for premium gold feel) */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[50%] -left-[10%] w-[60%] h-[150%] bg-gradient-to-br from-white/30 to-transparent rounded-full rotate-12 blur-2xl opacity-80" />
      </div>

      {/* Main Content (The Golden Ticket) */}
      <div className="flex-1 p-7 flex flex-col justify-center relative z-10">
        <div className="flex items-center gap-3 mb-3">
          <span className="inline-flex px-3 py-1 bg-[#4D1435] text-white text-[10px] font-black uppercase tracking-widest rounded-md shadow-sm">
            Highly Recommended
          </span>
          <span className="text-[#4D1435] text-[10px] font-extrabold uppercase tracking-widest">
            {course.age_label || `Phase ${stage?.roman} · ${stage?.averageMonths} MONTHS`}
          </span>
        </div>
        
        <h4 className="text-xl font-black text-[#4D1435] leading-tight mb-2 uppercase tracking-wide">
          {course.title}
        </h4>
        
        <p className="text-[13.5px] text-[#4D1435]/90 font-bold leading-relaxed max-w-lg mb-6 pr-4">
          {course.subtitle && course.subtitle.trim() !== "" 
            ? course.subtitle 
            : `Structured activities designed for ${childName}'s developmental stage. Accelerates progress across all 6 core competencies.`}
        </p>

        {/* Modern SaaS CTA Buttons */}
        <div className="mt-auto flex flex-col sm:flex-row items-center gap-4">
          <a
            href={demoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto no-print inline-flex items-center justify-center gap-2 rounded-lg bg-[#4D1435] px-6 py-3 text-[13px] font-black text-white hover:bg-[#3a0f28] transition-colors shadow-lg hover:shadow-xl hover:-translate-y-0.5 duration-200"
          >
            <SparklesIcon />
            CLAIM 7-DAY FREE DEMO
          </a>
          <a
            href={courseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto no-print inline-flex items-center justify-center gap-2 rounded-lg border-[2px] border-[#4D1435]/20 bg-white/40 backdrop-blur-sm px-6 py-3 text-[13px] font-black text-[#4D1435] hover:bg-white/60 transition-colors"
          >
            Explore Course
            <ArrowRightIcon />
          </a>
        </div>
      </div>

      {/* Right Block: White Print Ticket Stub */}
      <div className="w-full md:w-[170px] shrink-0 border-t-[3px] md:border-t-0 md:border-l-[3px] border-dashed border-[#4D1435]/30 bg-[#fffdfa] flex flex-col items-center justify-center p-5 relative z-10">
         <img
            src={qrUrl}
            alt="Scan to demo"
            className="w-[100px] h-[100px] object-contain rounded-none border-[1.5px] border-[#4D1435]/20 p-1.5 mb-3 shadow-sm bg-white"
            crossOrigin="anonymous"
         />
         <span className="text-[11px] font-black text-[#4D1435] text-center uppercase tracking-widest leading-snug">
           Scan To Start<br/>Free Demo
         </span>
         <span className="hidden print:block text-[8px] text-gray-500 mt-2 text-center w-full break-all leading-tight font-bold">
           {demoUrl}
         </span>
      </div>
    </div>
  );
}

function FallbackCta({ stageId, childName }: { stageId: string; childName: string }) {
  const mockCourse = {
    id: "fallback",
    stage_id: stageId,
    title: `Phase ${STAGE_BY_ID[stageId]?.roman || ''} — KGKP Program`,
    subtitle: `Structured activities designed for ${childName}'s developmental stage. Accelerates progress across all 6 core competencies.`,
    age_label: "Recommended",
    thumbnail_url: "",
    redirect_url: "https://www.kaushalyageniuskid.com",
    demo_url: `${DEMO_URL}?phase=${STAGE_BY_ID[stageId]?.roman || ''}`,
    is_active: true,
    sort_order: 1,
    description: null,
    created_by: null,
    created_at: "",
    updated_at: ""
  } as unknown as CourseRecommendation;
  return <CourseCard course={mockCourse} childName={childName} />;
}
