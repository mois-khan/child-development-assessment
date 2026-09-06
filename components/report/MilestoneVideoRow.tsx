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

  return (
    <div className="mt-6 border-t border-line-soft pt-5">
      <p className="eyebrow mb-3">🎬 Milestone Videos — {domainName}</p>
      <div className="flex gap-3 overflow-x-auto pb-2 no-print">
        {videos.map(video => <VideoCard key={video.id} video={video} />)}
      </div>
    </div>
  );
}

function VideoCard({ video }: { video: MilestoneVideo }) {
  return (
    <div className="w-48 shrink-0 rounded-[var(--radius-sm)] bg-[var(--surface-2)] overflow-hidden flex flex-col">
      {video.thumbnail_url ? (
        <img 
          src={video.thumbnail_url} 
          alt={video.title} 
          className="h-28 w-full object-cover" 
        />
      ) : (
        <div className="h-28 w-full bg-[var(--surface-3)] flex items-center justify-center text-2xl">
          ▶️
        </div>
      )}
      <div className="p-3 flex flex-col flex-1">
        <h4 className="text-sm font-extrabold text-ink line-clamp-2">{video.title}</h4>
        {video.description && (
          <p className="text-xs text-ink-3 mt-1 line-clamp-2">{video.description}</p>
        )}
        <div className="mt-auto pt-2.5">
          <a 
            href={video.redirect_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-bold text-[var(--accent)] hover:underline"
          >
            Watch →
          </a>
        </div>
      </div>
    </div>
  );
}
