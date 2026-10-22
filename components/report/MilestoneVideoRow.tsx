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
    <div className="mt-3 pt-2.5 border-t border-gray-200 w-full flex flex-col">
      <span className="text-[9.5px] sm:text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
        Milestone Activity Video
      </span>
      
      <div className="w-full flex flex-row bg-white border border-gray-200 rounded-lg overflow-hidden shadow-xs relative">
        <div className="absolute left-0 top-0 w-1 h-full bg-[#4D1435]" />
        
        {/* Left: Sharp QR Code */}
        <div className="w-[86px] sm:w-[94px] shrink-0 bg-gray-50 flex flex-col items-center justify-center p-2 border-r border-gray-200">
          <img
            src={qrUrl}
            alt="Scan to watch"
            className="w-[50px] h-[50px] sm:w-[54px] sm:h-[54px] object-contain rounded-none border border-gray-200 p-0.5 bg-white mb-1 shadow-xs"
            crossOrigin="anonymous"
          />
          <span className="text-[7.5px] sm:text-[8px] font-bold text-gray-700 text-center uppercase tracking-widest leading-tight">
            Scan To Watch
          </span>
        </div>

        {/* Right: Content & Action */}
        <div className="flex-1 p-2.5 sm:p-3 flex flex-col justify-center min-w-0">
          <h4 className="text-[12px] sm:text-[13px] font-bold text-gray-900 leading-snug mb-1 line-clamp-1 sm:line-clamp-2">
            {video.title}
          </h4>
          
          {video.description && (
            <p className="text-[10.5px] sm:text-[11px] text-gray-600 font-medium leading-tight line-clamp-2 mb-1.5 pr-1">
              {video.description}
            </p>
          )}
          
          <a
            href={video.redirect_url}
            target="_blank"
            rel="noopener noreferrer"
            className="no-print self-start inline-flex items-center gap-1.5 rounded-md bg-[#4D1435] px-3 py-1 text-[10px] sm:text-[10.5px] font-medium text-white hover:bg-[#3d102a] transition-colors shadow-xs"
          >
            <PlayIcon />
            Watch Video
          </a>
          
          <span className="hidden print:block text-[8px] text-gray-400 truncate max-w-full leading-tight font-medium">
            Link: {video.redirect_url}
          </span>
        </div>

      </div>
    </div>
  );
}
