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
import { Card, Button, Badge, ConfirmDeleteButton, IconChevronRight, IconClose, IconPlus, InlineBanner, useBanner } from "@/components/ui";

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
  const banner = useBanner();

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

    // Append to the end of this stage's list rather than always inserting at
    // 0 — otherwise every new card ties for first and ordering is whatever
    // Postgres happens to return.
    const stageSiblings = courses.filter(
      c => c.stage_id === drawerStageId && c.id !== editingCourse?.id
    );
    const nextSortOrder = stageSiblings.length > 0
      ? Math.max(...stageSiblings.map(c => c.sort_order)) + 1
      : 0;

    const input: CourseRecommendationInput = {
      stage_id: drawerStageId,
      title,
      subtitle,
      description,
      age_label: ageLabel,
      thumbnail_url: thumbnailUrl,
      redirect_url: redirectUrl,
      sort_order: editingCourse ? editingCourse.sort_order : nextSortOrder,
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
      banner.showSuccess(editingCourse ? "Course updated." : "Course added.");
    } catch (err: any) {
      banner.showError("Failed to save: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCourseRecommendation(id);
      fetchCourses();
      banner.showSuccess("Course deleted.");
    } catch (err: any) {
      banner.showError("Failed to delete: " + err.message);
    }
  };

  const handleToggleActive = async (id: string, currentlyActive: boolean) => {
    try {
      await toggleCourseRecommendationActive(id, !currentlyActive);
      setCourses(courses.map(c => c.id === id ? { ...c, is_active: !currentlyActive } : c));
    } catch (err: any) {
      banner.showError("Failed to toggle status: " + err.message);
    }
  };

  // Group courses by stage
  const groups = new Map<string, CourseRecommendation[]>();
  courses.forEach(c => {
    if (!groups.has(c.stage_id)) groups.set(c.stage_id, []);
    groups.get(c.stage_id)!.push(c);
  });

  return (
    <div className="space-y-6 pb-10">
      <InlineBanner message={banner.message} onDismiss={banner.clear} />
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">Course Recommendations</h1>
          <p className="mt-1 text-sm text-ink-3">
            Courses shown at the end of the assessment report, based on the child&apos;s overall phase.
          </p>
        </div>
        <Button onClick={() => openAddDrawer()} variant="primary" iconLeft={<IconPlus size={16} />}>
          Add Course
        </Button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-surface-3" />
            ))}
          </div>
        ) : (
          BRAIN_STAGES.map(stage => {
            const stageCourses = groups.get(stage.id) || [];

            return (
              <Card key={stage.id} className="overflow-hidden !p-0">
                <details className="group" open>
                  <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-x-3 gap-y-1 px-5 py-4 transition-colors hover:bg-surface-2">
                    <span className="flex min-w-0 items-center gap-2">
                      <IconChevronRight size={16} className="shrink-0 text-ink-3 transition-transform group-open:rotate-90" />
                      <span className="min-w-0 text-base font-extrabold text-ink">
                        Phase {stage.roman} · {stage.name}{" "}
                        <span className="whitespace-nowrap text-sm font-medium text-ink-3">
                          ({stage.averageMonths} mo avg)
                        </span>
                      </span>
                    </span>
                    <Badge size="sm" tone={stageCourses.length > 0 ? "accent" : "neutral"}>
                      {stageCourses.length} course{stageCourses.length === 1 ? "" : "s"}
                    </Badge>
                  </summary>

                  <div className="border-t border-line-soft px-5 py-5">
                    {stageCourses.length === 0 ? (
                      <button
                        onClick={() => openAddDrawer(stage.id)}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line px-4 py-6 text-sm font-bold text-ink-3 transition-colors hover:border-accent hover:bg-[var(--accent-soft)] hover:text-accent"
                      >
                        <IconPlus size={16} />
                        Add a course for this phase
                      </button>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          {stageCourses.map(course => (
                            <Card key={course.id} variant="clay" className="flex h-32 overflow-hidden">
                              <div className="w-32 shrink-0 bg-surface-3">
                                {course.thumbnail_url ? (
                                  <img src={course.thumbnail_url} alt="" className="h-full w-full object-cover" />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-3xl">🎓</div>
                                )}
                              </div>
                              <div className="flex min-w-0 flex-1 flex-col p-4">
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className="flex-1 truncate font-bold text-ink">{course.title}</h4>
                                  <button
                                    onClick={() => handleToggleActive(course.id, course.is_active)}
                                    className={`shrink-0 rounded-full px-2 py-0.5 text-2xs font-bold uppercase tracking-wider ${course.is_active ? "bg-green-100 text-green-700" : "bg-surface-3 text-ink-3"}`}
                                  >
                                    {course.is_active ? "Active" : "Inactive"}
                                  </button>
                                </div>
                                <p className="truncate text-sm text-ink-2">{course.subtitle || "No subtitle"}</p>

                                <div className="mt-auto flex items-center justify-between gap-2">
                                  {course.age_label ? (
                                    <span className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-2xs font-bold text-[var(--accent)]">
                                      {course.age_label}
                                    </span>
                                  ) : (
                                    <span />
                                  )}

                                  <div className="flex shrink-0 gap-2">
                                    <Button size="sm" variant="ghost" onClick={() => openEditDrawer(course)}>
                                      Edit
                                    </Button>
                                    <ConfirmDeleteButton onConfirm={() => handleDelete(course.id)} />
                                  </div>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                        <button
                          onClick={() => openAddDrawer(stage.id)}
                          className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-accent hover:underline"
                        >
                          <IconPlus size={14} />
                          Add another course to this phase
                        </button>
                      </>
                    )}
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
                <p className="hint">Where tapping the course card takes a parent.</p>
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
