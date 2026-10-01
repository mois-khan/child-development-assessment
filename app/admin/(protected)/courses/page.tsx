"use client";

import { useEffect, useState } from "react";
import { BRAIN_STAGES, formatStageMonths } from "@/content/stages";
import { CourseRecommendation, CourseRecommendationInput } from "@/lib/types/recommendations";
import { 
  listAllCourseRecommendations, 
  createCourseRecommendation, 
  updateCourseRecommendation, 
  deleteCourseRecommendation,
  toggleCourseRecommendationActive
} from "@/lib/data/course-recommendations";
import { Card, Button, Badge, ConfirmDeleteButton, IconChevronRight, IconClose, IconPlus, IconSparkle, InlineBanner, useBanner } from "@/components/ui";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function CourseRecommendationsPage() {
  const [courses, setCourses] = useState<CourseRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseRecommendation | null>(null);
  
  const [activeStageId, setActiveStageId] = useState<string>(BRAIN_STAGES[0].id);

  // Drawer state
  const [drawerStageId, setDrawerStageId] = useState(BRAIN_STAGES[0].id);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [ageLabel, setAgeLabel] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [redirectUrl, setRedirectUrl] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const banner = useBanner();
  const supabase = getSupabaseBrowserClient();

  const fetchCourses = () => {
    setLoading(true);
    listAllCourseRecommendations()
      .then(setCourses)
      .catch(err => banner.showError("Failed to fetch courses: " + err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const openAddDrawer = (stageId?: string) => {
    setEditingCourse(null);
    setDrawerStageId(stageId || activeStageId);
    setTitle("");
    setSubtitle("");
    setDescription("");
    setAgeLabel("");
    setThumbnailUrl("");
    setRedirectUrl("");
    setDemoUrl("");
    setIsActive(true);
    setDrawerOpen(true);
  };

  const openEditDrawer = (course: CourseRecommendation) => {
    setEditingCourse(course);
    setDrawerStageId(course.stage_id);
    setTitle(course.title);
    setSubtitle(course.subtitle);
    setDescription(course.description || "");
    setAgeLabel(course.age_label || "");
    setThumbnailUrl(course.thumbnail_url || "");
    setRedirectUrl(course.redirect_url);
    setDemoUrl(course.demo_url || "");
    setIsActive(course.is_active);
    setDrawerOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCourseRecommendation(id);
      banner.showSuccess("Course deleted.");
      setCourses(courses.filter(c => c.id !== id));
    } catch (err: any) {
      banner.showError(err.message);
    }
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    try {
      await toggleCourseRecommendationActive(id, !current);
      setCourses(courses.map(c => c.id === id ? { ...c, is_active: !current } : c));
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
      const { data, error } = await supabase.storage.from('assets').upload(`thumbnails/${filename}`, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('assets').getPublicUrl(`thumbnails/${filename}`);
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
    const input: CourseRecommendationInput = {
      stage_id: drawerStageId,
      title,
      subtitle,
      description,
      age_label: ageLabel,
      thumbnail_url: thumbnailUrl,
      redirect_url: redirectUrl,
      demo_url: demoUrl,
      is_active: isActive,
      sort_order: editingCourse ? editingCourse.sort_order : 0
    };

    try {
      if (editingCourse) {
        const updated = await updateCourseRecommendation(editingCourse.id, input);
        setCourses(courses.map(c => c.id === editingCourse.id ? updated : c));
        banner.showSuccess("Course updated.");
      } else {
        const created = await createCourseRecommendation(input);
        setCourses([...courses, created]);
        banner.showSuccess("Course created.");
        if (drawerStageId !== activeStageId) setActiveStageId(drawerStageId);
      }
      setDrawerOpen(false);
    } catch (err: any) {
      banner.showError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const groups = new Map<string, CourseRecommendation[]>();
  courses.forEach(c => {
    if (!groups.has(c.stage_id)) groups.set(c.stage_id, []);
    groups.get(c.stage_id)!.push(c);
  });

  const activeStage = BRAIN_STAGES.find(s => s.id === activeStageId)!;
  const activeStageCourses = groups.get(activeStageId) || [];

  return (
    <div className="mx-auto max-w-7xl pb-12">
      <InlineBanner message={banner.message} onDismiss={banner.clear} />
      
      <div className="mb-8 border-b border-line pb-6 pt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-ink tracking-tight">Course Recommendations</h1>
          <p className="mt-2 max-w-3xl text-base text-ink-3">
            Manage the suggested courses that appear on the final page of the assessment report.
          </p>
        </div>
        <Button onClick={() => openAddDrawer()} variant="primary" iconLeft={<IconPlus size={16} />}>
          Add Course
        </Button>
      </div>

      <div className="flex flex-col gap-8 md:flex-row">
        
        {/* Sidebar Navigation */}
        <div className="w-full shrink-0 md:w-64">
          <div className="sticky top-6 flex flex-col gap-1 rounded-2xl border border-line bg-white p-2 shadow-sm">
            <h3 className="mb-2 mt-2 px-4 text-[10px] font-extrabold uppercase tracking-widest text-ink-4">Brain Stages</h3>
            {BRAIN_STAGES.map((stage) => {
              const isActive = activeStageId === stage.id;
              const count = (groups.get(stage.id) || []).length;
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
          <div className="mb-6 flex items-center justify-between border-b border-line pb-4">
            <div>
              <h2 className="text-2xl font-black text-ink">Phase {activeStage.roman}: {activeStage.name}</h2>
              <p className="text-ink-3 mt-1 text-sm font-medium">Average Age: {activeStage.averageMonths} months</p>
            </div>
            <Button onClick={() => openAddDrawer(activeStageId)} variant="secondary" size="sm" iconLeft={<IconPlus size={14} />}>
              Add Course to Phase {activeStage.roman}
            </Button>
          </div>

          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent"></div>
            </div>
          ) : activeStageCourses.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-line py-20 text-center">
              <div className="mb-4 rounded-full bg-surface-2 p-4 text-ink-4">
                <IconSparkle size={32} />
              </div>
              <p className="text-lg font-bold text-ink-3">No courses recommended</p>
              <p className="mt-1 text-sm text-ink-4 mb-6">Parents will not see any course suggestions for this phase.</p>
              <Button onClick={() => openAddDrawer(activeStageId)} variant="primary" iconLeft={<IconPlus size={16} />}>
                Add First Course
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-2">
              {activeStageCourses.map(course => (
                <Card key={course.id} className="flex flex-col overflow-hidden border border-line p-0 shadow-sm transition-shadow hover:shadow-md">
                  <div className="relative h-40 w-full bg-surface-2">
                    {course.thumbnail_url ? (
                      <img src={course.thumbnail_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-ink-4">
                        <IconSparkle size={32} />
                      </div>
                    )}
                    {!course.is_active && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                        <Badge tone="neutral" className="border-white/20 bg-black text-white">Hidden</Badge>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <h3 className="font-extrabold text-ink line-clamp-2">{course.title}</h3>
                      <button
                        onClick={() => handleToggleActive(course.id, course.is_active)}
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold transition-colors ${
                          course.is_active 
                            ? "bg-green-100 text-green-700 hover:bg-green-200" 
                            : "bg-surface-3 text-ink-3 hover:bg-surface-4"
                        }`}
                      >
                        {course.is_active ? "Active" : "Hidden"}
                      </button>
                    </div>
                    {course.subtitle && <p className="mb-3 text-sm font-medium text-ink-3 line-clamp-1">{course.subtitle}</p>}
                    
                    <div className="mt-auto pt-4 flex items-center justify-between border-t border-line">
                      <div className="flex shrink-0 gap-2">
                        <Button size="sm" variant="ghost" onClick={() => openEditDrawer(course)}>
                          Edit
                        </Button>
                        <ConfirmDeleteButton onConfirm={() => handleDelete(course.id)} />
                      </div>
                      {course.age_label && (
                        <span className="rounded-full bg-surface-2 px-3 py-1 text-[10px] font-bold text-ink-2 uppercase tracking-wider border border-line">
                          {course.age_label}
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => !saving && setDrawerOpen(false)} />
          <div className="animate-rise relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-[var(--surface)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-line p-5">
              <h2 className="text-lg font-bold">{editingCourse ? "Edit Course" : "Add Course"}</h2>
              <button onClick={() => !saving && setDrawerOpen(false)} className="p-2 text-ink-3 hover:bg-surface-2 rounded-full">
                <IconClose size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 space-y-5 overflow-y-auto p-5">
              <div>
                <label className="label">Phase *</label>
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
                <label className="label">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tummy Time Basics"
                  className="field"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  disabled={saving}
                />
              </div>

              <div>
                <label className="label">Subtitle</label>
                <input
                  type="text"
                  placeholder="A short line under the title"
                  className="field"
                  value={subtitle}
                  onChange={e => setSubtitle(e.target.value)}
                  disabled={saving}
                />
              </div>

              <div>
                <label className="label">Age Label</label>
                <input
                  type="text"
                  placeholder="e.g. 0-3 months"
                  className="field"
                  value={ageLabel}
                  onChange={e => setAgeLabel(e.target.value)}
                  disabled={saving}
                />
                <p className="hint">Shown as a badge on the card.</p>
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
                <label className="label">Explore URL (Redirect) *</label>
                <input
                  type="url"
                  required
                  placeholder="https://..."
                  className="field"
                  value={redirectUrl}
                  onChange={e => setRedirectUrl(e.target.value)}
                  disabled={saving}
                />
                <p className="hint">Where the "Explore" button takes a parent.</p>
              </div>

              <div>
                <label className="label">Free Demo URL</label>
                <input
                  type="url"
                  placeholder="https://www.kaushalyageniuskid.com/demo"
                  className="field"
                  value={demoUrl}
                  onChange={e => setDemoUrl(e.target.value)}
                  disabled={saving}
                />
                <p className="hint">Overrides the default demo button link if provided.</p>
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
                  {saving ? "Saving..." : "Save Course"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
