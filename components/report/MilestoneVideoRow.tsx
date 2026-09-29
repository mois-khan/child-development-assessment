"use client";

import { useEffect, useState } from "react";
import type { DomainCode } from "@/lib/types";
import type { MilestoneVideo } from "@/lib/types/recommendations";
import { getMilestoneVideos } from "@/lib/data/milestone-videos";
import { isSupabaseConfigured } from "@/lib/supabase/env";

interface MilestoneVideoRowProps {
  stageId: string;     // e.g. "s3"
  domain: DomainCode;  // e.g. "vision"
  domainName: string;  // e.g. "Visual Competence" for the heading
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

  const video = videos[0]; // Show the first/primary video for this stage+domain
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(video.redirect_url)}&color=4D1435&bgcolor=FFFFFF&margin=4`;

  return (
    <div className="mt-4 pt-4 border-t-2 border-dashed border-[#4D1435]/30">
      {/* Section label */}
      <p className="text-[0.75rem] font-extrabold uppercase tracking-[0.12em] text-[#4D1435] mb-3">
        📹 Milestone Activity Video
      </p>

      <div className="flex gap-4 items-start p-3 rounded-xl border-2 border-[#4D1435]/20 bg-gradient-to-br from-[#4D1435]/5 to-transparent">
        {/* QR Code — visible in print, scan to watch */}
        <div className="shrink-0 flex flex-col items-center gap-1">
          <img
            src={qrUrl}
            alt={`QR code for ${video.title}`}
            className="w-[80px] h-[80px] rounded-lg border-2 border-[#4D1435]/30 bg-white p-0.5 shadow-sm print:block"
            crossOrigin="anonymous"
          />
          <p className="text-[7px] font-bold text-[#4D1435] text-center leading-tight uppercase tracking-wide">
            Scan to<br/>Watch
          </p>
        </div>

        {/* Video info */}
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <h4 className="text-[0.85rem] font-extrabold text-[#4D1435] leading-snug line-clamp-2">
            {video.title}
          </h4>
          {video.description && (
            <p className="text-[0.75rem] text-gray-600 leading-relaxed line-clamp-2">
              {video.description}
            </p>
          )}
          {/* Visit link — only shows on screen/digital PDF */}
          <a
            href={video.redirect_url}
            target="_blank"
            rel="noopener noreferrer"
            className="no-print mt-1 inline-flex items-center gap-1.5 self-start rounded-full bg-[#4D1435] px-3 py-1 text-[0.7rem] font-bold text-white hover:bg-[#4D1435]/90 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
              <path d="M6.3 2.84A1.5 1.5 0 0 0 4 4.11v11.78a1.5 1.5 0 0 0 2.3 1.27l9.344-5.891a1.5 1.5 0 0 0 0-2.538L6.3 2.84Z" />
            </svg>
            Watch Video
          </a>
          {/* Print fallback URL */}
          <p className="hidden print:block text-[7px] text-gray-500 break-all leading-tight mt-1">
            {video.redirect_url}
          </p>
        </div>
      </div>
    </div>
  );
}
