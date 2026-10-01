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
import { Card, Button, Badge, ConfirmDeleteButton, IconChevronRight, IconClose, IconPlus, IconSparkle, InlineBanner, useBanner, domainColor, domainName } from "@/components/ui";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { IconVisual, IconAuditory, IconTactile, IconMobility, IconLanguage, IconManual } from "@/components/ui/icons";

export default function MilestoneVideosPage() {
  const [videos, setVideos] = useState<MilestoneVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStageId, setActiveStageId] = useState<string>(BRAIN_STAGES[0].id);
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
  const [uploading, setUploading] = useState(false);
  const banner = useBanner();
  const supabase = getSupabaseBrowserClient();

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
    setDrawerStageId(stageId || activeStageId);
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
    setDescription(video.description || "");
    setThumbnailUrl(video.thumbnail_url || "");
    setRedirectUrl(video.redirect_url);
    setIsActive(video.is_active);
    setDrawerOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMilestoneVideo(id);
      banner.showSuccess("Video deleted.");
      setVideos(videos.filter(v => v.id !== id));
    } catch (err: any) {
      banner.showError(err.message);
    }
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    try {
      await toggleMilestoneVideoActive(id, !current);
      setVideos(videos.map(v => v.id === id ? { ...v, is_active: !current } : v));
    } catch (err: any) {
      banner.showError(err.message);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const filename = `${Math.random().toString(36).slice(2)}_${Date.now()}.${ext}`;
      const { data, error } = await supabase.storage.from("thumbnails").upload(filename, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("thumbnails").getPublicUrl(filename);
      setThumbnailUrl(publicUrl);
    } catch (err: any) {
      banner.showError("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const input: MilestoneVideoInput = {
      stage_id: drawerStageId,
      domain: drawerDomain,
      title,
      description,
      thumbnail_url: thumbnailUrl,
      redirect_url: redirectUrl,
      is_active: isActive,
      sort_order: editingVideo ? editingVideo.sort_order : 0
    };

    try {
      if (editingVideo) {
        const updated = await updateMilestoneVideo(editingVideo.id, input);
        setVideos(videos.map(v => v.id === editingVideo.id ? updated : v));
        banner.showSuccess("Video updated.");
      } else {
        const created = await createMilestoneVideo(input);
        setVideos([...videos, created]);
        banner.showSuccess("Video created.");
        if (drawerStageId !== activeStageId) setActiveStageId(drawerStageId);
      }
      setDrawerOpen(false);
    } catch (err: any) {
      banner.showError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const groups = new Map<string, MilestoneVideo[]>();
  videos.forEach(v => {
    const key = `${v.stage_id}-${v.domain}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(v);
  });

  const activeStage = BRAIN_STAGES.find(s => s.id === activeStageId)!;

  const DOMAIN_ICONS: Record<string, React.ReactNode> = {
    vision: <IconVisual size={20} />,
    auditory: <IconAuditory size={20} />,
    tactile: <IconTactile size={20} />,
    mobility: <IconMobility size={20} />,
    language: <IconLanguage size={20} />,
    hand: <IconManual size={20} />
  };

  return (
    <div className="mx-auto max-w-7xl pb-12">
      <InlineBanner message={banner.message} onDismiss={banner.clear} />
      
      <div className="mb-8 border-b border-line pb-6 pt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-ink tracking-tight">Milestone Videos</h1>
          <p className="mt-2 max-w-3xl text-base text-ink-3">
            Manage the videos shown inside each domain card of the report, matched to the child&apos;s stage.
          </p>
        </div>
        <Button onClick={() => openAddDrawer()} variant="primary" iconLeft={<IconPlus size={16} />}>
          Add Video
        </Button>
      </div>

      <div className="flex flex-col gap-8 md:flex-row">
        
        {/* Sidebar Navigation */}
        <div className="w-full shrink-0 md:w-64">
          <div className="sticky top-6 flex flex-col gap-1 rounded-2xl border border-line bg-white p-2 shadow-sm">
            <h3 className="mb-2 mt-2 px-4 text-[10px] font-extrabold uppercase tracking-widest text-ink-4">Brain Stages</h3>
            {BRAIN_STAGES.map((stage) => {
              const isActive = activeStageId === stage.id;
              // Count all videos for this stage
              const count = DOMAINS.reduce((acc, d) => acc + (groups.get(`${stage.id}-${d.code}`) || []).length, 0);
              return (
                <button
                  key={stage.id}
                  onClick={() => setActiveStageId(stage.id)}
                  className={`flex items-center justify-between rounded-xl px-4 py-3 text-left transition-all duration-200 ${
                    isActive ? "bg-ink text-white shadow-md" : "text-ink-2 hover:bg-surface-2"
                  }`}
                >
                  <span className="font-bold text-sm">Phase {stage.roman}</span>
                  {count > 0 && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-surface-3 text-ink-3'}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          <div className="mb-8 border-b border-line pb-4">
            <h2 className="text-2xl font-black text-ink">Phase {activeStage.roman}: {activeStage.name}</h2>
            <p className="text-ink-3 mt-1 text-sm font-medium">Configure videos for each competence area below.</p>
          </div>

          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {DOMAINS.map(domain => {
                const cellVideos = groups.get(`${activeStage.id}-${domain.code}`) || [];
                return (
                  <Card key={domain.code} className="overflow-hidden border border-line p-0 shadow-sm transition-shadow hover:shadow-md">
                    <div className="flex items-center justify-between border-b border-line px-5 py-4" style={{ backgroundColor: `${domainColor(domain.code as any)}15` }}>
                      <div className="flex items-center gap-3">
                        <span style={{ color: domainColor(domain.code as any) }}>{DOMAIN_ICONS[domain.code]}</span>
                        <h3 className="font-bold text-ink">{domainName(domain.code as any)}</h3>
                      </div>
                      <Button onClick={() => openAddDrawer(activeStage.id, domain.code)} variant="ghost" size="sm" iconLeft={<IconPlus size={14} />}>
                        Add Video
                      </Button>
                    </div>

                    <div className="p-5">
                      {cellVideos.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-6 text-center">
                          <p className="text-sm font-bold text-ink-3">No videos added yet</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          {cellVideos.map(video => (
                            <div key={video.id} className="flex flex-col overflow-hidden rounded-xl border border-line bg-surface-2/50 transition-colors hover:bg-surface-2">
                              <div className="flex items-center gap-4 p-4">
                                {video.thumbnail_url ? (
                                  <img src={video.thumbnail_url} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover shadow-sm border border-line" />
                                ) : (
                                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-surface-3 border border-line text-ink-4">
                                    <IconSparkle size={20} />
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <h4 className="truncate font-bold text-ink">{video.title}</h4>
                                    {!video.is_active && <span className="rounded-full bg-surface-3 px-2 py-0.5 text-[10px] font-bold text-ink-3">Hidden</span>}
                                  </div>
                                  <p className="truncate text-xs text-ink-3 mt-0.5">{video.description || "No description"}</p>
                                </div>
                              </div>
                              <div className="flex items-center justify-between border-t border-line px-4 py-2 bg-white/50">
                                <button
                                  onClick={() => handleToggleActive(video.id, video.is_active)}
                                  className={`text-xs font-bold transition-colors ${
                                    video.is_active ? "text-green-600 hover:text-green-700" : "text-ink-4 hover:text-ink-3"
                                  }`}
                                >
                                  {video.is_active ? "Mark as Hidden" : "Mark as Active"}
                                </button>
                                <div className="flex gap-2">
                                  <button onClick={() => openEditDrawer(video)} className="text-xs font-bold text-ink-3 hover:text-ink">Edit</button>
                                  <ConfirmDeleteButton onConfirm={() => handleDelete(video.id)} />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Phase *</label>
                  <select
                    className="field"
                    value={drawerStageId}
                    onChange={e => setDrawerStageId(e.target.value)}
                    disabled={saving}
                  >
                    {BRAIN_STAGES.map(s => <option key={s.id} value={s.id}>Phase {s.roman}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Competence Domain *</label>
                  <select
                    className="field"
                    value={drawerDomain}
                    onChange={e => setDrawerDomain(e.target.value as any)}
                    disabled={saving}
                  >
                    {DOMAINS.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Video Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Visual tracking exercise"
                  className="field"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  disabled={saving}
                />
              </div>

              <div>
                <label className="label">Short Description</label>
                <textarea
                  className="field min-h-[80px]"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  disabled={saving}
                />
              </div>

              <div>
                <label className="label">Thumbnail Photo {uploading && <span className="text-accent text-xs ml-2 animate-pulse">Uploading...</span>}</label>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={saving || uploading}
                    className="field py-1.5 text-sm file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-surface-2 file:text-ink hover:file:bg-surface-3"
                  />
                  <input
                    type="url"
                    placeholder="Or enter image URL https://..."
                    className="field"
                    value={thumbnailUrl}
                    onChange={e => setThumbnailUrl(e.target.value)}
                    disabled={saving || uploading}
                  />
                </div>
                {thumbnailUrl && (
                  <div className="mt-2 h-20 w-32 overflow-hidden rounded-lg border border-line-soft bg-surface-2">
                    <img src={thumbnailUrl} alt="Preview" className="h-full w-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
                  </div>
                )}
              </div>

              <div>
                <label className="label">Video URL (Redirect) *</label>
                <input
                  type="url"
                  required
                  placeholder="https://youtube.com/..."
                  className="field"
                  value={redirectUrl}
                  onChange={e => setRedirectUrl(e.target.value)}
                  disabled={saving}
                />
              </div>

              <label className="flex cursor-pointer items-center gap-2.5 pt-1">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={e => setIsActive(e.target.checked)}
                  disabled={saving}
                  className="size-4 rounded border-line-strong accent-[var(--accent)]"
                />
                <span className="text-sm font-semibold text-ink-2">Active - visible to parents</span>
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
