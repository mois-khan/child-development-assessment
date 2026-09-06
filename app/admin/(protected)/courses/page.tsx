"use client";

import { useEffect, useState } from "react";
import { BRAIN_STAGES } from "@/content/stages";
import { CourseRecommendation, CourseRecommendationInput } from "@/lib/types/recommendations";
import { 
  listAllCourseRecommendations, 
  createCourseRecommendation, 
  updateCourseRecommendation, 
  deleteCourseRecommendation,
  toggleCourseRecommendationActive
} from "@/lib/data/course-recommendations";
import { Card, Button, Badge, IconClose } from "@/components/ui";

export default function CourseRecommendationsPage() {
  const [courses, setCourses] = useState<CourseRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseRecommendation | null>(null);
  
  // Drawer state
  const [drawerStageId, setDrawerStageId] = useState(BRAIN_STAGES[0].id);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [ageLabel, setAgeLabel] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [redirectUrl, setRedirectUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchCourses = () => {
    setLoading(true);
    listAllCourseRecommendations()
      .then(setCourses)
      .catch(err => alert("Failed to fetch courses: " + err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const openAddDrawer = (stageId?: string) => {
    setEditingCourse(null);
    setDrawerStageId(stageId || BRAIN_STAGES[0].id);
    setTitle("");
    setSubtitle("");
    setDescription("");
    setAgeLabel("");
    setThumbnailUrl("");
    setRedirectUrl("");
    setIsActive(true);
    setDrawerOpen(true);
  };

  const openEditDrawer = (course: CourseRecommendation) => {
    setEditingCourse(course);
    setDrawerStageId(course.stage_id);
    setTitle(course.title);
    setSubtitle(course.subtitle);
    setDescription(course.description);
    setAgeLabel(course.age_label);
    setThumbnailUrl(course.thumbnail_url);
    setRedirectUrl(course.redirect_url);
    setIsActive(course.is_active);
    setDrawerOpen(true);
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
      sort_order: editingCourse ? editingCourse.sort_order : 0,
      is_active: isActive
    };

    try {
      if (editingCourse) {
        await updateCourseRecommendation(editingCourse.id, input);
      } else {
        await createCourseRecommendation(input);
      }
      setDrawerOpen(false);
      fetchCourses();
    } catch (err: any) {
      alert("Failed to save: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this course recommendation?")) return;
    try {
      await deleteCourseRecommendation(id);
      fetchCourses();
    } catch (err: any) {
      alert("Failed to delete: " + err.message);
    }
  };
  
  const handleToggleActive = async (id: string, currentlyActive: boolean) => {
    try {
      await toggleCourseRecommendationActive(id, !currentlyActive);
      setCourses(courses.map(c => c.id === id ? { ...c, is_active: !currentlyActive } : c));
    } catch (err: any) {
      alert("Failed to toggle status: " + err.message);
    }
  };

  // Group courses by stage
  const groups = new Map<string, CourseRecommendation[]>();
  courses.forEach(c => {
    if (!groups.has(c.stage_id)) groups.set(c.stage_id, []);
    groups.get(c.stage_id)!.push(c);
  });

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">Course Recommendations</h1>
          <p className="mt-1 text-sm text-ink-3">
            Courses shown at the end of the assessment report, based on the child&apos;s overall brain stage.
          </p>
        </div>
        <Button onClick={() => openAddDrawer()} variant="primary">
          + Add Course
        </Button>
      </div>

      <div className="mt-8 space-y-8">
        {loading ? (
          <p className="text-ink-3">Loading courses...</p>
        ) : (
          BRAIN_STAGES.map(stage => {
            const stageCourses = groups.get(stage.id) || [];
            
            return (
              <details key={stage.id} className="group" open>
                <summary className="cursor-pointer list-none py-2 border-b border-line-soft flex items-center justify-between">
                  <span className="text-xl font-bold text-ink">
                    Stage {stage.roman} — {stage.name} <span className="text-sm font-normal text-ink-3 ml-2">({stage.averageMonths} months avg)</span>
                  </span>
                  <Badge size="sm" tone="neutral">{stageCourses.length} courses</Badge>
                </summary>
                
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 pl-4 border-l-2 border-line-soft">
                  {stageCourses.length === 0 ? (
                    <div className="col-span-full py-4">
                      <p className="text-sm text-ink-3 mb-2">No courses for this stage.</p>
                      <button 
                        onClick={() => openAddDrawer(stage.id)}
                        className="text-sm font-semibold text-accent hover:underline"
                      >
                        + Add one
                      </button>
                    </div>
                  ) : (
                    <>
                      {stageCourses.map(course => (
                        <Card key={course.id} variant="clay" className="flex overflow-hidden h-32">
                          <div className="w-32 shrink-0 bg-surface-3">
                            {course.thumbnail_url ? (
                              <img src={course.thumbnail_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-3xl">🎓</div>
                            )}
                          </div>
                          <div className="flex-1 p-4 flex flex-col min-w-0">
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="font-bold text-ink truncate flex-1">{course.title}</h4>
                              <button 
                                onClick={() => handleToggleActive(course.id, course.is_active)}
                                className={`shrink-0 text-2xs uppercase tracking-wider px-2 py-0.5 rounded-full font-bold ${course.is_active ? 'bg-green-100 text-green-700' : 'bg-surface-3 text-ink-3'}`}
                              >
                                {course.is_active ? 'Active' : 'Inactive'}
                              </button>
                            </div>
                            <p className="text-sm text-ink-2 truncate">{course.subtitle || "No subtitle"}</p>
                            
                            <div className="mt-auto flex items-center justify-between">
                              {course.age_label ? (
                                <span className="text-2xs font-bold px-2 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                                  {course.age_label}
                                </span>
                              ) : <span />}
                              
                              <div className="flex gap-2">
                                <Button size="sm" variant="ghost" onClick={() => openEditDrawer(course)}>Edit</Button>
                                <Button size="sm" variant="ghost" onClick={() => handleDelete(course.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50">Delete</Button>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                      <div className="col-span-full pt-2">
                        <button 
                          onClick={() => openAddDrawer(stage.id)}
                          className="text-sm font-semibold text-accent hover:underline"
                        >
                          + Add course to this stage
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </details>
            );
          })
        )}
      </div>

      {/* Drawer Overlay */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => !saving && setDrawerOpen(false)} />
          <div className="relative w-full max-w-md bg-[var(--surface)] shadow-2xl flex flex-col animate-slide-in-right h-full overflow-y-auto">
            <div className="flex items-center justify-between border-b border-line p-5">
              <h2 className="text-lg font-bold">{editingCourse ? "Edit Course" : "Add Course"}</h2>
              <button onClick={() => !saving && setDrawerOpen(false)} className="p-2 text-ink-3 hover:bg-surface-2 rounded-full">
                <IconClose size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-5 space-y-5 flex-1">
              <div>
                <label className="block text-sm font-semibold text-ink-2 mb-1">Stage *</label>
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
                <label className="block text-sm font-semibold text-ink-2 mb-1">Subtitle</label>
                <input 
                  type="text" 
                  className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm"
                  value={subtitle}
                  onChange={e => setSubtitle(e.target.value)}
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-2 mb-1">Age Label</label>
                <input 
                  type="text" 
                  placeholder="e.g. 0-3 months"
                  className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm"
                  value={ageLabel}
                  onChange={e => setAgeLabel(e.target.value)}
                  disabled={saving}
                />
                <p className="mt-1 text-xs text-ink-3">Shown as a badge on the card.</p>
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
                  {saving ? "Saving..." : "Save Course"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
