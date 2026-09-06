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
import { Card, Button, Badge, IconClose } from "@/components/ui";

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

  const fetchVideos = () => {
    setLoading(true);
    listAllMilestoneVideos()
      .then(setVideos)
      .catch(err => alert("Failed to fetch videos: " + err.message))
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
    
    const input: MilestoneVideoInput = {
      stage_id: drawerStageId,
      domain: drawerDomain as any,
      title,
      description,
      thumbnail_url: thumbnailUrl,
      redirect_url: redirectUrl,
      sort_order: editingVideo ? editingVideo.sort_order : 0, // simple append for now
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
    } catch (err: any) {
      alert("Failed to save: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this video?")) return;
    try {
      await deleteMilestoneVideo(id);
      fetchVideos();
    } catch (err: any) {
      alert("Failed to delete: " + err.message);
    }
  };
  
  const handleToggleActive = async (id: string, currentlyActive: boolean) => {
    try {
      await toggleMilestoneVideoActive(id, !currentlyActive);
      setVideos(videos.map(v => v.id === id ? { ...v, is_active: !currentlyActive } : v));
    } catch (err: any) {
      alert("Failed to toggle status: " + err.message);
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
    <>
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">Milestone Videos</h1>
          <p className="mt-1 text-sm text-ink-3">Manage curated video recommendations for the assessment report.</p>
        </div>
        <Button onClick={() => openAddDrawer()} variant="primary">
          + Add Video
        </Button>
      </div>

      <div className="mt-6 flex flex-wrap gap-4">
        <select 
          className="rounded-md border border-line bg-surface px-3 py-1.5 text-sm"
          value={filterStage}
          onChange={e => setFilterStage(e.target.value)}
        >
          <option value="all">All Stages</option>
          {BRAIN_STAGES.map(s => (
            <option key={s.id} value={s.id}>Stage {s.roman} - {s.name}</option>
          ))}
        </select>
        <select 
          className="rounded-md border border-line bg-surface px-3 py-1.5 text-sm"
          value={filterDomain}
          onChange={e => setFilterDomain(e.target.value)}
        >
          <option value="all">All Domains</option>
          {DOMAINS.map(d => (
            <option key={d.code} value={d.code}>{d.name}</option>
          ))}
        </select>
      </div>

      <div className="mt-8 space-y-6">
        {loading ? (
          <p className="text-ink-3">Loading videos...</p>
        ) : filtered.length === 0 ? (
          <p className="text-ink-3">No milestone videos found matching these filters.</p>
        ) : (
          BRAIN_STAGES.map(stage => (
            (filterStage === "all" || filterStage === stage.id) && DOMAINS.map(domain => {
              if (filterDomain !== "all" && filterDomain !== domain.code) return null;
              
              const key = `${stage.id}-${domain.code}`;
              const cellVideos = groups.get(key) || [];
              
              if (cellVideos.length === 0 && (filterStage !== "all" || filterDomain !== "all")) return null;
              if (cellVideos.length === 0) return null;

              return (
                <details key={key} className="group" open>
                  <summary className="cursor-pointer list-none py-2 text-lg font-bold text-ink">
                    Stage {stage.roman} &middot; {domain.name}
                  </summary>
                  <div className="mt-3 space-y-3 pl-4 border-l-2 border-line-soft">
                    {cellVideos.map(video => (
                      <Card key={video.id} variant="clay" className="flex items-center gap-4 p-4">
                        {video.thumbnail_url ? (
                          <img src={video.thumbnail_url} alt="" className="h-12 w-12 rounded object-cover bg-surface-2 shrink-0" />
                        ) : (
                          <div className="h-12 w-12 rounded bg-surface-3 flex items-center justify-center shrink-0">▶️</div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-ink truncate">{video.title}</h4>
                          <p className="text-sm text-ink-3 truncate">{video.description || "No description"}</p>
                        </div>
                        <div className="shrink-0 flex items-center gap-3">
                          <button 
                            onClick={() => handleToggleActive(video.id, video.is_active)}
                            className={`text-xs px-2 py-1 rounded-full font-semibold ${video.is_active ? 'bg-green-100 text-green-700' : 'bg-surface-3 text-ink-3'}`}
                          >
                            {video.is_active ? 'Active' : 'Inactive'}
                          </button>
                          <Button size="sm" variant="ghost" onClick={() => openEditDrawer(video)}>Edit</Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(video.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50">Delete</Button>
                        </div>
                      </Card>
                    ))}
                    <button 
                      onClick={() => openAddDrawer(stage.id, domain.code)}
                      className="text-sm font-semibold text-accent hover:underline mt-2"
                    >
                      + Add video to this cell
                    </button>
                  </div>
                </details>
              );
            })
          ))
        )}
      </div>

      {/* Drawer Overlay */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => !saving && setDrawerOpen(false)} />
          <div className="relative w-full max-w-md bg-[var(--surface)] shadow-2xl flex flex-col animate-slide-in-right h-full overflow-y-auto">
            <div className="flex items-center justify-between border-b border-line p-5">
              <h2 className="text-lg font-bold">{editingVideo ? "Edit Video" : "Add Video"}</h2>
              <button onClick={() => !saving && setDrawerOpen(false)} className="p-2 text-ink-3 hover:bg-surface-2 rounded-full">
                <IconClose size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-5 space-y-5 flex-1">
              <div>
                <label className="block text-sm font-semibold text-ink-2 mb-1">Stage</label>
                <select 
                  className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm"
                  value={drawerStageId}
                  onChange={e => setDrawerStageId(e.target.value)}
                  disabled={saving}
                >
                  {BRAIN_STAGES.map(s => <option key={s.id} value={s.id}>Stage {s.roman} - {s.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-2 mb-1">Domain</label>
                <select 
                  className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm"
                  value={drawerDomain}
                  onChange={e => setDrawerDomain(e.target.value as import("@/lib/supabase/database.types").MilestoneVideoDomain)}
                  disabled={saving}
                >
                  {DOMAINS.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-2 mb-1">Title *</label>
                <input 
                  type="text" 
                  required
                  className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-2 mb-1">Description</label>
                <textarea 
                  className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm h-20 resize-none"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-2 mb-1">Thumbnail URL</label>
                <input 
                  type="url" 
                  className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm"
                  value={thumbnailUrl}
                  onChange={e => setThumbnailUrl(e.target.value)}
                  disabled={saving}
                />
                {thumbnailUrl && (
                  <div className="mt-2 h-20 w-32 bg-surface-2 rounded overflow-hidden">
                    <img src={thumbnailUrl} alt="Preview" className="h-full w-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-2 mb-1">Redirect URL *</label>
                <input 
                  type="url" 
                  required
                  className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm"
                  value={redirectUrl}
                  onChange={e => setRedirectUrl(e.target.value)}
                  disabled={saving}
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox" 
                  id="isActive"
                  checked={isActive}
                  onChange={e => setIsActive(e.target.checked)}
                  disabled={saving}
                  className="h-4 w-4 rounded border-line"
                />
                <label htmlFor="isActive" className="text-sm font-semibold text-ink-2">Active</label>
              </div>

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
    </>
  );
}
