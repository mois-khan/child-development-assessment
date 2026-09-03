"use client";

import { useState } from "react";
import Link from "next/link";
import {
  adminDeleteVideo,
  adminSaveVideo,
  deriveThumbnail,
  useAdminVideos,
  type AdminVideo,
  type VideoInput,
  type VideoProvider,
} from "@/lib/admin/videos";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { Badge, Button, Card, IconArrowLeft, IconPlay, IconPlus } from "@/components/ui";

const PROVIDERS: VideoProvider[] = ["youtube", "vimeo", "mp4"];

export default function AdminVideosPage() {
  const configured = isSupabaseConfigured();
  const { videos, refresh } = useAdminVideos();
  const [editingId, setEditingId] = useState<string | "new" | null>(null);

  if (configured) {
    return (
      <div className="space-y-6">
        <h1 className="!text-[1.6rem]">Video library</h1>
        <Card className="!p-8 text-center">
          <p className="text-[0.92rem] text-ink-3">
            Supabase-backed video library isn't wired up yet — see lib/admin/videos.ts.
          </p>
        </Card>
      </div>
    );
  }

  const editing = videos.find((v) => v.id === editingId);

  return (
    <div className="space-y-6">
      <Link
        href="/admin/activities"
        className="inline-flex items-center gap-1.5 text-[0.85rem] font-semibold text-ink-3 hover:text-ink"
      >
        <IconArrowLeft size={16} /> Activities
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="!text-[1.6rem]">Video library</h1>
            <Badge tone="warn">Dev mode — saved to this browser only</Badge>
          </div>
          <p className="mt-1.5 max-w-[62ch] text-[0.88rem] text-ink-3">
            Add a video once, then attach it to any activity. Attach it from an activity's edit
            form on the Activities page.
          </p>
        </div>
        <Button size="sm" iconLeft={<IconPlus size={16} />} onClick={() => setEditingId("new")}>
          Add video
        </Button>
      </div>

      {editingId === "new" && (
        <VideoForm
          onCancel={() => setEditingId(null)}
          onSaved={() => {
            refresh();
            setEditingId(null);
          }}
        />
      )}

      {videos.length === 0 ? (
        <Card className="!p-8 text-center">
          <p className="text-[0.9rem] text-ink-3">No videos yet.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) =>
            editingId === video.id ? (
              <div key={video.id} className="sm:col-span-2 lg:col-span-3">
                <VideoForm
                  existing={video}
                  onCancel={() => setEditingId(null)}
                  onSaved={() => {
                    refresh();
                    setEditingId(null);
                  }}
                />
              </div>
            ) : (
              <Card key={video.id} className="!p-0 overflow-hidden">
                <div className="relative flex aspect-video items-center justify-center bg-surface-3">
                  {video.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={video.thumbnailUrl} alt={video.altText ?? video.title} className="size-full object-cover" />
                  ) : (
                    <IconPlay size={28} className="text-ink-3" />
                  )}
                </div>
                <div className="p-4">
                  <p className="truncate text-[0.92rem] font-bold text-ink">{video.title}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge size="sm">{video.provider}</Badge>
                    {video.durationSeconds && (
                      <span className="text-[0.76rem] text-ink-3">
                        {Math.round(video.durationSeconds / 60)} min
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(video.id)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        adminDeleteVideo(video.id);
                        refresh();
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ),
          )}
        </div>
      )}
    </div>
  );
}

function VideoForm({
  existing,
  onCancel,
  onSaved,
}: {
  existing?: AdminVideo;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(existing?.title ?? "");
  const [provider, setProvider] = useState<VideoProvider>(existing?.provider ?? "youtube");
  const [url, setUrl] = useState(existing?.url ?? "");
  const [thumbnailUrl, setThumbnailUrl] = useState(existing?.thumbnailUrl ?? "");
  const [minutes, setMinutes] = useState(
    existing?.durationSeconds ? String(Math.round(existing.durationSeconds / 60)) : "",
  );

  const preview = thumbnailUrl || deriveThumbnail(provider, url);

  function save() {
    if (!title.trim() || !url.trim()) return;
    const input: VideoInput = {
      id: existing?.id,
      title: title.trim(),
      provider,
      url: url.trim(),
      thumbnailUrl: thumbnailUrl.trim() || undefined,
      durationSeconds: minutes ? Number(minutes) * 60 : undefined,
    };
    adminSaveVideo(input);
    onSaved();
  }

  return (
    <Card variant="tint" tint="var(--accent)" className="!p-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_10rem]">
        <div className="space-y-3">
          <div>
            <label className="label">Title</label>
            <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
          </div>
          <div className="flex flex-wrap gap-3">
            <div>
              <label className="label">Provider</label>
              <select
                className="field !w-auto"
                value={provider}
                onChange={(e) => setProvider(e.target.value as VideoProvider)}
              >
                {PROVIDERS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-[14rem] flex-1">
              <label className="label">Video URL</label>
              <input className="field" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
            </div>
            <div>
              <label className="label">Minutes</label>
              <input
                type="number"
                min={0}
                className="field !w-20"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="label">Thumbnail URL (optional — auto-filled for YouTube)</label>
            <input
              className="field"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              placeholder={preview ?? "https://…"}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={onCancel}>
              Cancel
            </Button>
            <Button size="sm" onClick={save}>
              Save
            </Button>
          </div>
        </div>
        <div className="flex aspect-video items-center justify-center overflow-hidden rounded-[var(--radius-sm)] bg-surface-3">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="size-full object-cover" />
          ) : (
            <IconPlay size={24} className="text-ink-3" />
          )}
        </div>
      </div>
    </Card>
  );
}
