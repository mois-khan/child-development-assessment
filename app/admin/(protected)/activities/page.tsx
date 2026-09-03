"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ADMIN_ACTIVITY_DOMAINS,
  adminDeleteActivity,
  adminListActivities,
  adminRevertActivity,
  adminSaveActivity,
  type AdminActivity,
  type ItemStatus as ActivityStatus,
} from "@/lib/admin/activities";
import { ACTIVITY_BANDS } from "@/content/activities";
import { useAdminVideos } from "@/lib/admin/videos";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { DomainCode } from "@/lib/types";
import {
  Badge,
  Button,
  Card,
  IconPlay,
  IconPlus,
  IconRefresh,
  domainColor,
  domainName,
} from "@/components/ui";

const STATUS_BADGE: Record<ActivityStatus, { label: string; tone: "warn" | "accent" } | null> = {
  base: null,
  edited: { label: "Edited", tone: "warn" },
  new: { label: "New", tone: "accent" },
  deleted: null,
};

export default function AdminActivitiesPage() {
  const configured = isSupabaseConfigured();
  const [domain, setDomain] = useState<DomainCode>(ADMIN_ACTIVITY_DOMAINS[0].code);
  const [stage, setStage] = useState<string>("");
  const [activities, setActivities] = useState<AdminActivity[]>([]);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { videos } = useAdminVideos();

  const stagesWithCounts = useMemo(() => {
    if (configured) return [];
    const all = adminListActivities({ domain });
    return ACTIVITY_BANDS.map((s) => ({
      stage: s,
      count: all.filter((a) => a.stage === s.id).length,
    }));
  }, [domain, configured, refreshKey]);

  // Default to one stage's worth of activities, not the whole domain at once.
  useEffect(() => {
    if (configured || stagesWithCounts.length === 0) return;
    setStage((current) => {
      if (current && stagesWithCounts.some((s) => s.stage.id === current && s.count > 0)) {
        return current;
      }
      return stagesWithCounts.find((s) => s.count > 0)?.stage.id ?? "";
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domain, configured]);

  useEffect(() => {
    if (configured) return;
    setActivities(adminListActivities({ domain, stage: stage || undefined }));
  }, [domain, stage, configured, refreshKey]);

  function refresh() {
    setRefreshKey((k) => k + 1);
    setEditingId(null);
  }

  if (configured) {
    return (
      <div className="space-y-6">
        <h1 className="!text-[1.6rem]">Activities & videos</h1>
        <Card className="!p-8 text-center">
          <p className="text-[0.92rem] text-ink-3">
            Supabase-backed activities aren't wired up yet — see lib/admin/activities.ts.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="!text-[1.6rem]">Activities & videos</h1>
            <Badge tone="warn">Dev mode — edits save to this browser only</Badge>
          </div>
          <p className="mt-1.5 max-w-[62ch] text-[0.88rem] text-ink-3">
            The home activities suggested per area and age stage. Attach a video from the{" "}
            <Link href="/admin/videos" className="font-semibold text-accent">
              video library
            </Link>{" "}
            to any activity below.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {ADMIN_ACTIVITY_DOMAINS.map((d) => (
          <button
            key={d.code}
            type="button"
            onClick={() => {
              setDomain(d.code);
              setEditingId(null);
            }}
            className="chip cursor-pointer"
            style={
              domain === d.code
                ? ({ "--chip-bg": domainColor(d.code), "--chip-fg": "#fff", "--chip-bd": "transparent" } as React.CSSProperties)
                : ({ "--chip-bg": "var(--surface-2)", "--chip-fg": "var(--ink-2)", "--chip-bd": "transparent" } as React.CSSProperties)
            }
          >
            {domainName(d.code)}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          className="field !w-auto"
          value={stage}
          onChange={(e) => {
            setStage(e.target.value);
            setEditingId(null);
          }}
        >
          <option value="">All stages</option>
          {stagesWithCounts.map(({ stage: s, count }) => (
            <option key={s.id} value={s.id} disabled={count === 0}>
              {s.label} ({count})
            </option>
          ))}
        </select>
        <Button
          size="sm"
          variant="secondary"
          iconLeft={<IconPlus size={16} />}
          onClick={() => setEditingId("new")}
          disabled={!stage}
        >
          Add activity{!stage ? " (pick a stage first)" : ""}
        </Button>
      </div>

      {editingId === "new" && (
        <ActivityForm
          domain={domain}
          stage={stage}
          videos={videos}
          onCancel={() => setEditingId(null)}
          onSaved={refresh}
        />
      )}

      {activities.length === 0 ? (
        <Card className="!p-8 text-center">
          <p className="text-[0.9rem] text-ink-3">No activities for this filter yet.</p>
        </Card>
      ) : stage ? (
        <Card className="!p-0 overflow-hidden">
          <ActivityList
            activities={activities}
            videos={videos}
            editingId={editingId}
            onEdit={setEditingId}
            onCancelEdit={() => setEditingId(null)}
            onSaved={refresh}
            onDelete={(id) => {
              adminDeleteActivity(id);
              refresh();
            }}
            onRevert={(id) => {
              adminRevertActivity(id);
              refresh();
            }}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {stagesWithCounts
            .filter(({ count }) => count > 0)
            .map(({ stage: s, count }) => (
              <details key={s.id} className="group card !p-0 overflow-hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-3.5 select-none">
                  <span className="text-[0.92rem] font-bold text-ink">{s.label}</span>
                  <span className="flex items-center gap-2">
                    <Badge size="sm">{count}</Badge>
                    <span className="text-ink-3 transition-transform group-open:rotate-90">›</span>
                  </span>
                </summary>
                <div className="border-t border-line">
                  <ActivityList
                    activities={activities.filter((a) => a.stage === s.id)}
                    videos={videos}
                    editingId={editingId}
                    onEdit={setEditingId}
                    onCancelEdit={() => setEditingId(null)}
                    onSaved={refresh}
                    onDelete={(id) => {
                      adminDeleteActivity(id);
                      refresh();
                    }}
                    onRevert={(id) => {
                      adminRevertActivity(id);
                      refresh();
                    }}
                  />
                </div>
              </details>
            ))}
        </div>
      )}
    </div>
  );
}

function ActivityList({
  activities,
  videos,
  editingId,
  onEdit,
  onCancelEdit,
  onSaved,
  onDelete,
  onRevert,
}: {
  activities: AdminActivity[];
  videos: ReturnType<typeof useAdminVideos>["videos"];
  editingId: string | "new" | null;
  onEdit: (id: string) => void;
  onCancelEdit: () => void;
  onSaved: () => void;
  onDelete: (id: string) => void;
  onRevert: (id: string) => void;
}) {
  return (
    <div className="divide-y divide-line">
      {activities.map((activity) =>
        editingId === activity.id ? (
          <div key={activity.id} className="p-5">
            <ActivityForm
              domain={activity.domain}
              stage={activity.stage}
              existing={activity}
              videos={videos}
              onCancel={onCancelEdit}
              onSaved={onSaved}
            />
          </div>
        ) : (
          <ActivityRow
            key={activity.id}
            activity={activity}
            video={videos.find((v) => v.id === activity.videoId)}
            onEdit={() => onEdit(activity.id)}
            onDelete={() => onDelete(activity.id)}
            onRevert={activity.status !== "base" ? () => onRevert(activity.id) : undefined}
          />
        ),
      )}
    </div>
  );
}

function ActivityRow({
  activity,
  video,
  onEdit,
  onDelete,
  onRevert,
}: {
  activity: AdminActivity;
  video?: { title: string; thumbnailUrl?: string };
  onEdit: () => void;
  onDelete: () => void;
  onRevert?: () => void;
}) {
  const badge = STATUS_BADGE[activity.status];
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 px-5 py-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-ink">{activity.title}</p>
          {badge && <Badge tone={badge.tone} size="sm">{badge.label}</Badge>}
          <span className="text-[0.78rem] text-ink-3">
            {activity.minutes} min · {activity.frequency}
          </span>
        </div>
        <p className="mt-1 text-[0.82rem] text-ink-3">{activity.description}</p>
        <p className="mt-1 text-[0.78rem] text-ink-3">Materials: {activity.materials}</p>
        {video ? (
          <p className="mt-1.5 inline-flex items-center gap-1.5 text-[0.78rem] font-semibold text-accent">
            <IconPlay size={12} /> {video.title}
          </p>
        ) : (
          <p className="mt-1.5 text-[0.76rem] text-ink-3">No video attached</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button size="sm" variant="ghost" onClick={onEdit}>
          Edit
        </Button>
        {onRevert && (
          <Button size="sm" variant="ghost" iconLeft={<IconRefresh size={14} />} onClick={onRevert}>
            Revert
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={onDelete}>
          Delete
        </Button>
      </div>
    </div>
  );
}

function ActivityForm({
  domain,
  stage,
  existing,
  videos,
  onCancel,
  onSaved,
}: {
  domain: DomainCode;
  stage: string;
  existing?: AdminActivity;
  videos: ReturnType<typeof useAdminVideos>["videos"];
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(existing?.title ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [materials, setMaterials] = useState(existing?.materials ?? "Nothing");
  const [minutes, setMinutes] = useState(String(existing?.minutes ?? 5));
  const [frequency, setFrequency] = useState(existing?.frequency ?? "Once a day");
  const [videoId, setVideoId] = useState(existing?.videoId ?? "");

  function save() {
    if (!title.trim() || !description.trim()) return;
    adminSaveActivity({
      id: existing?.id,
      domain,
      stage,
      title: title.trim(),
      description: description.trim(),
      materials: materials.trim() || "Nothing",
      minutes: Number(minutes) || 0,
      frequency: frequency.trim(),
      videoId: videoId || undefined,
    });
    onSaved();
  }

  return (
    <Card variant="tint" tint="var(--accent)" className="!p-5">
      <div className="space-y-3">
        <div>
          <label className="label">Title</label>
          <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="field" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="min-w-[10rem] flex-1">
            <label className="label">Materials</label>
            <input className="field" value={materials} onChange={(e) => setMaterials(e.target.value)} />
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
          <div className="min-w-[10rem]">
            <label className="label">Frequency</label>
            <input className="field" value={frequency} onChange={(e) => setFrequency(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">Suggested video</label>
          <select className="field !w-auto" value={videoId} onChange={(e) => setVideoId(e.target.value)}>
            <option value="">No video</option>
            {videos.map((v) => (
              <option key={v.id} value={v.id}>
                {v.title}
              </option>
            ))}
          </select>
          {videos.length === 0 && (
            <p className="hint">
              No videos yet —{" "}
              <Link href="/admin/videos" className="font-semibold text-accent">
                add one
              </Link>
              .
            </p>
          )}
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
    </Card>
  );
}
