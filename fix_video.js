const fs = require('fs');

const src = \"use client";

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

  return (
    <div className="mt-6 pt-4">
      <div className="flex flex-wrap gap-4">
        {videos.map(video => (
          <div key={video.id} className="flex gap-4 p-4 border-2 border-gray-100 rounded-xl items-center w-full bg-gray-50/50">
            {/* QR Code for print and scan */}
            <div className="shrink-0">
              <img 
                src={\\\https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=\\\\} 
                alt="QR Code" 
                className="w-24 h-24 rounded-lg bg-white p-1 border border-gray-200 shadow-sm"
                crossOrigin="anonymous"
              />
            </div>
            
            {/* Video Details */}
            <div className="flex flex-col justify-center flex-1">
              <h4 className="text-[1.1rem] font-bold text-[#4D1435] mb-1">{video.title}</h4>
              {video.description && (
                <p className="text-sm text-gray-600 mb-2 leading-relaxed line-clamp-2">{video.description}</p>
              )}
              <a 
                href={video.redirect_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="no-print inline-flex items-center text-sm font-bold text-[#4D1435] hover:underline"
              >
                Watch Video 
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
\;

fs.writeFileSync('components/report/MilestoneVideoRow.tsx', src);
