"use client";

import { useEffect, useState } from "react";
import { BRAIN_STAGES } from "@/content/stages";
import { DOMAINS } from "@/content/domains";
import { MilestoneVideo, MilestoneVideoInput } from "@/lib/types/recommendations";
import { 
  listAllMilestoneVideos, 
  createMilestoneVideo, 
  updateMilestoneVideo, 
  deleteMilestoneVideo,
  toggleMilestoneVideoActive
} from "@/lib/data/milestone-videos";
import { Card, Button, Badge, ConfirmDeleteButton, IconChevronRight, IconClose, IconPlus, InlineBanner, useBanner } from "@/components/ui";

export default function MilestoneVideosPage() {
  const [videos, setVideos] = useState<MilestoneVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStage, setFilterStage] = useState<string>("all");
  const [filterDomain, setFilterDomain] = useState<string>("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<MilestoneVideo | null>(null);
  
  // Drawer state
  const [drawerStageId, setDrawerStageId] = useState(BRAIN_STAGES[0].id);
  const [drawerDomain, setDrawerDomain] = useState<import("@/lib/supabase/database.types").MilestoneVideoDomain>(DOMAINS[0].code as any);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [redirectUrl, setRedirectUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const banner = useBanner();

  const fetchVideos = () => {
    setLoading(true);
    listAllMilestoneVideos()
      .then(setVideos)
      .catch(err => banner.showError("Failed to fetch videos: " + err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const openAddDrawer = (stageId?: string, domain?: string) => {
    setEditingVideo(null);
    setDrawerStageId(stageId || BRAIN_STAGES[0].id);
    setDrawerDomain((domain || DOMAINS[0].code) as import("@/lib/supabase/database.types").MilestoneVideoDomain);
    setTitle("");
    setDescription("");
    setThumbnailUrl("");
    setRedirectUrl("");
    setIsActive(true);
    setDrawerOpen(true);
  };

  const openEditDrawer = (video: MilestoneVideo) => {
    setEditingVideo(video);
    setDrawerStageId(video.stage_id);
    setDrawerDomain(video.domain);
    setTitle(video.title);
    setDescription(video.description);
    setThumbnailUrl(video.thumbnail_url);
    setRedirectUrl(video.redirect_url);
    setIsActive(video.is_active);
    setDrawerOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // Append to the end of this (stage, domain) cell rather than always
    // inserting at 0 — otherwise every new card ties for first and ordering
    // is whatever Postgres happens to return.
    const cellSiblings = videos.filter(
      v => v.stage_id === drawerStageId && v.domain === drawerDomain && v.id !== editingVideo?.id
    );
    const nextSortOrder = cellSiblings.length > 0
      ? Math.max(...cellSiblings.map(v => v.sort_order)) + 1
      : 0;

    const input: MilestoneVideoInput = {
      stage_id: drawerStageId,
      domain: drawerDomain as any,
      title,
      description,
      thumbnail_url: thumbnailUrl,
      redirect_url: redirectUrl,
      sort_order: editingVideo ? editingVideo.sort_order : nextSortOrder,
      is_active: isActive
    };

    try {
      if (editingVideo) {
        await updateMilestoneVideo(editingVideo.id, input);
      } else {
        await createMilestoneVideo(input);
      }
      setDrawerOpen(false);
      fetchVideos();
      banner.showSuccess(editingVideo ? "Video updated." : "Video added.");
    } catch (err: any) {
      banner.showError("Failed to save: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMilestoneVideo(id);
      fetchVideos();
      banner.showSuccess("Video deleted.");
    } catch (err: any) {
      banner.showError("Failed to delete: " + err.message);
    }
  };

  const handleToggleActive = async (id: string, currentlyActive: boolean) => {
    try {
      await toggleMilestoneVideoActive(id, !currentlyActive);
      setVideos(videos.map(v => v.id === id ? { ...v, is_active: !currentlyActive } : v));
    } catch (err: any) {
      banner.showError("Failed to toggle status: " + err.message);
    }
  };

  // Group videos
  const filtered = videos.filter(v => 
    (filterStage === "all" || v.stage_id === filterStage) &&
    (filterDomain === "all" || v.domain === filterDomain)
  );

  const groups = new Map<string, MilestoneVideo[]>();
  filtered.forEach(v => {
    const key = `${v.stage_id}-${v.domain}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(v);
  });

  return (
    <div className="space-y-6 pb-10">
      <InlineBanner message={banner.message} onDismiss={banner.clear} />
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">Milestone Videos</h1>
          <p className="mt-1 text-sm text-ink-3">
            Shown inside each domain card of the report, matched to the child&apos;s stage.
          </p>
        </div>
        <Button onClick={() => openAddDrawer()} variant="primary" iconLeft={<IconPlus size={16} />}>
          Add Video
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          className="field !w-auto min-w-[14rem]"
          value={filterStage}
          onChange={e => setFilterStage(e.target.value)}
        >
          <option value="all">All Stages</option>
          {BRAIN_STAGES.map(s => (
            <option key={s.id} value={s.id}>Phase {s.roman} - {s.name}</option>
          ))}
        </select>
        <select
          className="field !w-auto min-w-[12rem]"
          value={filterDomain}
          onChange={e => setFilterDomain(e.target.value)}
        >
          <option value="all">All Domains</option>
          {DOMAINS.map(d => (
            <option key={d.code} value={d.code}>{d.name}</option>
          ))}
        </select>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-surface-3" />
            ))}
          </div>
        ) : (
          BRAIN_STAGES.filter(stage => filterStage === "all" || filterStage === stage.id).map(stage => {
            const stageDomains = DOMAINS.filter(d => filterDomain === "all" || filterDomain === d.code);
            const stageVideoCount = stageDomains.reduce(
              (n, d) => n + (groups.get(`${stage.id}-${d.code}`)?.length ?? 0),
              0,
            );

            return (
              <Card key={stage.id} className="overflow-hidden !p-0">
                <details className="group" open>
                  <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-x-3 gap-y-1 px-5 py-4 transition-colors hover:bg-surface-2">
                    <span className="flex min-w-0 items-center gap-2">
                      <IconChevronRight size={16} className="shrink-0 text-ink-3 transition-transform group-open:rotate-90" />
                      <span className="text-base font-extrabold text-ink">
                        Phase {stage.roman} · {stage.name}
                      </span>
                    </span>
                    <Badge size="sm" tone={stageVideoCount > 0 ? "accent" : "neutral"}>
                      {stageVideoCount} video{stageVideoCount === 1 ? "" : "s"}
                    </Badge>
                  </summary>

                  <div className="divide-y divide-line-soft border-t border-line-soft">
                    {stageDomains.map(domain => {
                      const cellVideos = groups.get(`${stage.id}-${domain.code}`) || [];
                      return (
                        <div key={domain.code} className="px-5 py-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-bold text-ink">{domain.name}</p>
                            <button
                              onClick={() => openAddDrawer(stage.id, domain.code)}
                              className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-accent hover:underline"
                            >
                              <IconPlus size={13} />
                              Add
                            </button>
                          </div>

                          {cellVideos.length === 0 ? (
                            <p className="mt-1 text-xs text-ink-3">No videos yet</p>
                          ) : (
                            <div className="mt-3 space-y-2">
                              {cellVideos.map(video => (
                                <Card key={video.id} variant="clay" className="flex items-center gap-4 p-3.5">
                                  {video.thumbnail_url ? (
                                    <img src={video.thumbnail_url} alt="" className="h-11 w-11 shrink-0 rounded-lg bg-surface-2 object-cover" />
                                  ) : (
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-surface-3">▶️</div>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <h4 className="truncate font-bold text-ink">{video.title}</h4>
                                    <p className="truncate text-sm text-ink-3">{video.description || "No description"}</p>
                                  </div>
                                  <div className="flex shrink-0 items-center gap-2.5">
                                    <button
                                      onClick={() => handleToggleActive(video.id, video.is_active)}
                                      className={`rounded-full px-2 py-1 text-xs font-semibold ${video.is_active ? "bg-green-100 text-green-700" : "bg-surface-3 text-ink-3"}`}
                                    >
                                      {video.is_active ? "Active" : "Inactive"}
                                    </button>
                                    <Button size="sm" variant="ghost" onClick={() => openEditDrawer(video)}>Edit</Button>
                                    <ConfirmDeleteButton onConfirm={() => handleDelete(video.id)} />
                                  </div>
                                </Card>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </details>
              </Card>
            );
          })
        )}
      </div>

      {/* Add/Edit dialog */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => !saving && setDrawerOpen(false)} />
          <div className="animate-rise relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-[var(--surface)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-line p-5">
              <h2 className="text-lg font-bold">{editingVideo ? "Edit Video" : "Add Video"}</h2>
              <button onClick={() => !saving && setDrawerOpen(false)} className="p-2 text-ink-3 hover:bg-surface-2 rounded-full">
                <IconClose size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="flex-1 space-y-5 overflow-y-auto p-5">
              <div>
                <label className="label">Phase</label>
                <select
                  className="field"
                  value={drawerStageId}
                  onChange={e => setDrawerStageId(e.target.value)}
                  disabled={saving}
                >
                  {BRAIN_STAGES.map(s => <option key={s.id} value={s.id}>Phase {s.roman} - {s.name}</option>)}
                </select>
              </div>

              <div>
                <label className="label">Domain</label>
                <select
                  className="field"
                  value={drawerDomain}
                  onChange={e => setDrawerDomain(e.target.value as import("@/lib/supabase/database.types").MilestoneVideoDomain)}
                  disabled={saving}
                >
                  {DOMAINS.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
                </select>
              </div>

              <div>
                <label className="label">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Encouraging tummy time"
                  className="field"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  disabled={saving}
                />
              </div>

              <div>
                <label className="label">Description</label>
                <textarea
                  className="field"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  disabled={saving}
                />
              </div>

              <div>
                <label className="label">Thumbnail URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  className="field"
                  value={thumbnailUrl}
                  onChange={e => setThumbnailUrl(e.target.value)}
                  disabled={saving}
                />
                {thumbnailUrl && (
                  <div className="mt-2 h-20 w-32 overflow-hidden rounded-lg border border-line-soft bg-surface-2">
                    <img src={thumbnailUrl} alt="Preview" className="h-full w-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
                  </div>
                )}
              </div>

              <div>
                <label className="label">Redirect URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://..."
                  className="field"
                  value={redirectUrl}
                  onChange={e => setRedirectUrl(e.target.value)}
                  disabled={saving}
                />
                <p className="hint">Where tapping the video takes a parent — usually a YouTube link.</p>
              </div>

              <label className="flex cursor-pointer items-center gap-2.5 pt-1">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={e => setIsActive(e.target.checked)}
                  disabled={saving}
                  className="size-4 rounded border-line-strong accent-[var(--accent)]"
                />
                <span className="text-sm font-semibold text-ink-2">Active — visible to parents</span>
              </label>

              <div className="pt-6 border-t border-line flex gap-3 justify-end">
                <Button type="button" variant="ghost" onClick={() => setDrawerOpen(false)} disabled={saving}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={saving}>
                  {saving ? "Saving..." : "Save Video"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
