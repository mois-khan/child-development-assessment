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
function CapIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
      <path d="M6 12v5c3 3 9 3 12 0v-5"/>
    </svg>
  );
}

function SparklesIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
    return <div className="h-[180px] w-full rounded-xl bg-gray-100 animate-pulse border border-gray-200 mt-2" />;
  }

  if (courses.length === 0) {
    return <FallbackCta stageId={stageId} childName={childName} />;
  }

  return (
    <div className="flex flex-col gap-5 items-center w-full mt-3">
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
  
  // Sharp QR edge generation: purely square, clean colors.
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(demoUrl)}&color=000000&bgcolor=FFFFFF&margin=0`;

  return (
    <div className="w-full bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-row group hover:shadow-md transition-shadow relative">
      
      {/* Left Block: Premium Minimalist Phase Indicator */}
      <div className="w-[100px] shrink-0 bg-gray-50 flex flex-col items-center justify-center p-4 border-r border-gray-200 relative">
        <div className="absolute left-0 top-0 w-1 h-full bg-[#4D1435]" />
        <div className="text-gray-400 mb-2">
          <CapIcon />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-0.5">Phase</span>
        <span className="text-2xl font-black text-[#4D1435]">{stage?.roman}</span>
      </div>

      {/* Middle Block: Clean SaaS Content & Buttons */}
      <div className="flex-1 p-6 flex flex-col justify-center">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-block px-2.5 py-1 bg-[#4D1435]/10 text-[#4D1435] text-[10px] font-bold uppercase tracking-widest rounded">
            Recommended
          </span>
          <span className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider">
            {course.age_label || `${stage?.averageMonths} MONTHS`}
          </span>
        </div>
        
        <h4 className="text-lg font-bold text-gray-900 leading-tight mb-1.5">
          {course.title}
        </h4>
        
        <p className="text-[13px] text-gray-600 font-medium leading-relaxed max-w-lg mb-5 pr-4">
          {course.subtitle && course.subtitle.trim() !== "" 
            ? course.subtitle 
            : `Structured activities designed for ${childName}'s developmental stage. Accelerates progress across all 6 core competencies.`}
        </p>

        {/* Modern SaaS CTA Buttons */}
        <div className="mt-auto flex items-center gap-3">
          <a
            href={demoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="no-print inline-flex items-center justify-center gap-2 rounded-lg bg-[#F4A93B] px-5 py-2.5 text-[13px] font-semibold text-[#4D1435] hover:bg-[#E8971F] transition-colors shadow-sm"
          >
            <SparklesIcon />
            Claim 7-Day Free Demo
          </a>
          <a
            href={courseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="no-print inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            Explore Course
            <ArrowRightIcon />
          </a>
        </div>
      </div>

      {/* Right Block: Print Ticket with Sharp QR Code */}
      <div className="w-[150px] shrink-0 border-l border-dashed border-gray-300 flex flex-col items-center justify-center p-5 bg-white">
         <img
            src={qrUrl}
            alt="Scan to demo"
            className="w-[88px] h-[88px] object-contain rounded-none border border-gray-200 p-1 mb-3 shadow-sm"
            crossOrigin="anonymous"
         />
         <span className="text-[10px] font-bold text-gray-800 text-center uppercase tracking-widest leading-snug">
           Scan To Start<br/>Free Demo
         </span>
         <span className="hidden print:block text-[8px] text-gray-400 mt-2 text-center w-full break-all leading-tight">
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
