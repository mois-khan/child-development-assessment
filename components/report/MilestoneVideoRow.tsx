"use client";

import { useEffect, useState } from "react";
import type { DomainCode } from "@/lib/types";
import type { MilestoneVideo } from "@/lib/types/recommendations";
import { getMilestoneVideos } from "@/lib/data/milestone-videos";
import { isSupabaseConfigured } from "@/lib/supabase/env";

interface MilestoneVideoRowProps {
  stageId: string;
  domain: DomainCode;
  domainName: string;
}

function PlayIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M6 4l15 8-15 8z" />
    </svg>
  );
}

export function MilestoneVideoRow({ stageId, domain, domainName }: MilestoneVideoRowProps) {
  const [videos, setVideos] = useState<MilestoneVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    getMilestoneVideos(stageId, domain)
      .then((data) => {
        if (active) {
          setVideos(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch milestone videos:", err);
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [stageId, domain]);

  if (loading || videos.length === 0) {
    return null;
  }

  const video = videos[0];
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(video.redirect_url)}&color=000000&bgcolor=FFFFFF&margin=0`;

  return (
    <div className="mt-6 pt-5 border-t border-gray-200 w-full flex flex-col">
      <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-3">
        Milestone Activity Video
      </span>
      
      <div className="w-full flex flex-row bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm relative">
        <div className="absolute left-0 top-0 w-1 h-full bg-[#4D1435]" />
        
        {/* Left: Sharp QR Code */}
        <div className="w-[100px] sm:w-[130px] shrink-0 bg-gray-50 flex flex-col items-center justify-center p-3 border-r border-gray-200">
          <img
            src={qrUrl}
            alt="Scan to watch"
            className="w-[60px] h-[60px] sm:w-[72px] sm:h-[72px] object-contain rounded-none border border-gray-200 p-1 bg-white mb-2 shadow-sm"
            crossOrigin="anonymous"
          />
          <span className="text-[8px] sm:text-[9px] font-bold text-gray-700 text-center uppercase tracking-widest leading-snug hidden sm:block">
            Scan To<br/>Watch
          </span>
          <span className="text-[8px] sm:text-[9px] font-bold text-gray-700 text-center uppercase tracking-widest leading-snug sm:hidden">
            Scan
          </span>
        </div>

        {/* Right: Content & Action */}
        <div className="flex-1 p-3 sm:p-5 flex flex-col justify-center">
          <h4 className="text-[14px] sm:text-[15px] font-bold text-gray-900 leading-snug mb-1 sm:mb-1.5 line-clamp-2">
            {video.title}
          </h4>
          
          {video.description && (
            <p className="hidden sm:block text-[12.5px] text-gray-600 font-medium leading-relaxed line-clamp-2 max-w-lg mb-4 pr-4">
              {video.description}
            </p>
          )}
          
          <a
            href={video.redirect_url}
            target="_blank"
            rel="noopener noreferrer"
            className="no-print self-start inline-flex items-center gap-1.5 sm:gap-2 rounded-lg bg-[#4D1435] px-4 py-2 sm:px-5 sm:py-2.5 text-[11px] sm:text-[12px] font-medium text-white hover:bg-[#3d102a] transition-colors shadow-sm mt-1 sm:mt-0"
          >
            <PlayIcon />
            Watch Video
          </a>
          
          <span className="hidden print:block text-[9px] text-gray-400 break-all leading-tight mt-1.5 font-medium">
            Link: {video.redirect_url}
          </span>
        </div>

      </div>
    </div>
  );
}
