"use client";

import { useMemo, useState } from "react";
import {
  adminDeleteCourse,
  adminSaveCourse,
  useAdminCourses,
  type AdminCourse,
  type CourseInput,
} from "@/lib/admin/courses";
import {
  adminDeleteRule,
  adminSaveRule,
  previewMatch,
  useAdminRules,
  type AdminRecommendationRule,
  type RuleInput,
} from "@/lib/admin/recommendations";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { DOMAINS } from "@/content/domains";
import { STATUSES } from "@/lib/scoring";
import type { DomainCode, StatusCode } from "@/lib/types";
import { Badge, Button, Card, ConfirmDeleteButton, IconPlus, domainName } from "@/components/ui";

const STATUS_OPTIONS = Object.values(STATUSES);

export default function AdminCoursesPage() {
  const configured = isSupabaseConfigured();

  if (configured) {
    return (
      <div className="space-y-6">
        <h1 className="!text-[1.6rem]">Courses</h1>
        <Card className="!p-8 text-center">
          <p className="text-[0.92rem] text-ink-3">
            Supabase-backed courses aren't wired up yet — see lib/admin/courses.ts and
            lib/admin/recommendations.ts.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="!text-[1.6rem]">Courses</h1>
          <Badge tone="warn">Dev mode — saved to this browser only</Badge>
        </div>
        <p className="mt-1.5 max-w-[62ch] text-[0.88rem] text-ink-3">
          The catalog, and the rules that decide which course a report recommends. Live on the
          report page — the highest-priority matching rule replaces the default recommendation.
          Try it below before checking a real report.
        </p>
      </div>

      <CoursesAndRules />
    </div>
  );
}

/* ══ shared course state ══════════════════════════════════════════════════
 * Both the catalog and the rules list need the same course list — one
 * useAdminCourses() call here, passed down, so adding a course in the
 * catalog is immediately visible in the rules form without a page reload. */

function CoursesAndRules() {
  const { courses, refresh } = useAdminCourses();
  return (
    <>
      <CourseCatalog courses={courses} refresh={refresh} />
      <RecommendationRules courses={courses} />
    </>
  );
}

/* ══ course catalog ═══════════════════════════════════════════════════════ */

function CourseCatalog({
  courses,
  refresh,
}: {
  courses: AdminCourse[];
  refresh: () => void;
}) {
  const [editingId, setEditingId] = useState<string | "new" | null>(null);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="!text-[1.15rem]">Catalog</h2>
        <Button size="sm" iconLeft={<IconPlus size={16} />} onClick={() => setEditingId("new")}>
          Add course
        </Button>
      </div>

      {editingId === "new" && (
        <CourseForm
          onCancel={() => setEditingId(null)}
          onSaved={() => {
            refresh();
            setEditingId(null);
          }}
        />
      )}

      {courses.length === 0 ? (
        <Card className="!p-6 text-center">
          <p className="text-[0.9rem] text-ink-3">No courses yet.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) =>
            editingId === course.id ? (
              <div key={course.id} className="sm:col-span-2 lg:col-span-3">
                <CourseForm
                  existing={course}
                  onCancel={() => setEditingId(null)}
                  onSaved={() => {
                    refresh();
                    setEditingId(null);
                  }}
                />
              </div>
            ) : (
              <Card key={course.id} className="!p-5">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold text-ink">{course.title}</p>
                  <Badge tone={course.isActive ? "success" : "neutral"} size="sm">
                    {course.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <p className="mt-1.5 text-[0.82rem] text-ink-3">{course.description}</p>
                <p className="mt-2 text-[0.85rem] font-semibold text-ink">
                  {course.price != null ? `${course.currency} ${course.price}` : "No price set"}
                </p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(course.id)}>
                    Edit
                  </Button>
                  <ConfirmDeleteButton
                    onConfirm={() => {
                      adminDeleteCourse(course.id);
                      refresh();
                    }}
                  />
                </div>
              </Card>
            ),
          )}
        </div>
      )}
    </section>
  );
}

function CourseForm({
  existing,
  onCancel,
  onSaved,
}: {
  existing?: AdminCourse;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [code, setCode] = useState(existing?.code ?? "");
  const [title, setTitle] = useState(existing?.title ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [price, setPrice] = useState(existing?.price != null ? String(existing.price) : "");
  const [currency, setCurrency] = useState(existing?.currency ?? "INR");
  const [checkoutUrl, setCheckoutUrl] = useState(existing?.checkoutUrl ?? "");
  const [thumbnailUrl, setThumbnailUrl] = useState(existing?.thumbnailUrl ?? "");
  const [isActive, setIsActive] = useState(existing?.isActive ?? true);

  function save() {
    if (!title.trim() || !code.trim()) return;
    const input: CourseInput = {
      id: existing?.id,
      code: code.trim(),
      title: title.trim(),
      description: description.trim(),
      price: price ? Number(price) : undefined,
      currency,
      checkoutUrl: checkoutUrl.trim() || undefined,
      thumbnailUrl: thumbnailUrl.trim() || undefined,
      isActive,
    };
    adminSaveCourse(input);
    onSaved();
  }

  return (
    <Card variant="tint" tint="var(--accent)" className="!p-5">
      <div className="space-y-3">
        <div className="flex flex-wrap gap-3">
          <div className="min-w-[10rem] flex-1">
            <label className="label">Title</label>
            <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
          </div>
          <div className="min-w-[10rem]">
            <label className="label">Code (slug)</label>
            <input className="field" value={code} onChange={(e) => setCode(e.target.value)} placeholder="milestones-acceleration" />
          </div>
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="field" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-3">
          <div>
            <label className="label">Price</label>
            <input type="number" min={0} className="field !w-24" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <div>
            <label className="label">Currency</label>
            <input className="field !w-20" value={currency} onChange={(e) => setCurrency(e.target.value)} />
          </div>
          <div className="min-w-[14rem] flex-1">
            <label className="label">Checkout URL</label>
            <input className="field" value={checkoutUrl} onChange={(e) => setCheckoutUrl(e.target.value)} placeholder="https://…" />
          </div>
        </div>
        <div>
          <label className="label">Thumbnail URL</label>
          <input className="field" value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} placeholder="https://…" />
        </div>
        <label className="flex w-fit items-center gap-2 text-[0.85rem] font-semibold text-ink-2">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          Active
        </label>
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

/* ══ recommendation rules ═════════════════════════════════════════════════ */

function RecommendationRules({ courses }: { courses: AdminCourse[] }) {
  const { rules, refresh } = useAdminRules();
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [previewDomain, setPreviewDomain] = useState<DomainCode | "">("");
  const [previewStatus, setPreviewStatus] = useState<StatusCode>("slow");

  const preview = useMemo(
    () => previewMatch(previewDomain || null, previewStatus),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [previewDomain, previewStatus, rules, courses],
  );

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="!text-[1.15rem]">Recommendation rules</h2>
        <Button
          size="sm"
          iconLeft={<IconPlus size={16} />}
          onClick={() => setEditingId("new")}
          disabled={courses.length === 0}
        >
          Add rule{courses.length === 0 ? " (add a course first)" : ""}
        </Button>
      </div>

      {editingId === "new" && (
        <RuleForm
          courses={courses}
          onCancel={() => setEditingId(null)}
          onSaved={() => {
            refresh();
            setEditingId(null);
          }}
        />
      )}

      {rules.length === 0 ? (
        <Card className="!p-6 text-center">
          <p className="text-[0.9rem] text-ink-3">
            No rules yet — every report falls back to the default recommendation.
          </p>
        </Card>
      ) : (
        <Card className="!p-0 overflow-hidden">
          <div className="divide-y divide-line">
            {rules.map((rule) =>
              editingId === rule.id ? (
                <div key={rule.id} className="p-5">
                  <RuleForm
                    existing={rule}
                    courses={courses}
                    onCancel={() => setEditingId(null)}
                    onSaved={() => {
                      refresh();
                      setEditingId(null);
                    }}
                  />
                </div>
              ) : (
                <RuleRow
                  key={rule.id}
                  rule={rule}
                  courseTitle={courses.find((c) => c.id === rule.courseId)?.title ?? "(deleted course)"}
                  onEdit={() => setEditingId(rule.id)}
                  onDelete={() => {
                    adminDeleteRule(rule.id);
                    refresh();
                  }}
                />
              ),
            )}
          </div>
        </Card>
      )}

      <Card className="!p-5">
        <h3 className="!text-[0.95rem]">Try it</h3>
        <p className="mt-1 text-[0.82rem] text-ink-3">
          Pick a domain and status to see which course a matching report would recommend.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <select
            className="field !w-auto"
            value={previewDomain}
            onChange={(e) => setPreviewDomain(e.target.value as DomainCode | "")}
          >
            <option value="">Any domain (overall status)</option>
            {DOMAINS.map((d) => (
              <option key={d.code} value={d.code}>
                {domainName(d.code)}
              </option>
            ))}
          </select>
          <select
            className="field !w-auto"
            value={previewStatus}
            onChange={(e) => setPreviewStatus(e.target.value as StatusCode)}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.code} value={s.code}>
                {s.label}
              </option>
            ))}
          </select>
          <span className="text-[0.85rem] text-ink-3">→</span>
          {preview ? (
            <Badge tone="accent">{preview.course.title}</Badge>
          ) : (
            <Badge tone="neutral">No match — default recommendation</Badge>
          )}
        </div>
      </Card>
    </section>
  );
}

function RuleRow({
  rule,
  courseTitle,
  onEdit,
  onDelete,
}: {
  rule: AdminRecommendationRule;
  courseTitle: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
      <div className="min-w-0 flex-1">
        <p className="text-[0.9rem] font-semibold text-ink">
          {rule.domain ? domainName(rule.domain) : "Any domain"} is{" "}
          {rule.status ? STATUSES[rule.status].label.toLowerCase() : "any status"} → {courseTitle}
        </p>
        <p className="mt-0.5 text-[0.76rem] text-ink-3">
          Priority {rule.priority} {!rule.isActive && "· Inactive"}
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button size="sm" variant="ghost" onClick={onEdit}>
          Edit
        </Button>
        <ConfirmDeleteButton onConfirm={onDelete} />
      </div>
    </div>
  );
}

function RuleForm({
  existing,
  courses,
  onCancel,
  onSaved,
}: {
  existing?: AdminRecommendationRule;
  courses: AdminCourse[];
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [courseId, setCourseId] = useState(existing?.courseId ?? courses[0]?.id ?? "");
  const [domain, setDomain] = useState<DomainCode | "">(existing?.domain ?? "");
  const [status, setStatus] = useState<StatusCode | "">(existing?.status ?? "slow");
  const [priority, setPriority] = useState(String(existing?.priority ?? 0));
  const [isActive, setIsActive] = useState(existing?.isActive ?? true);

  function save() {
    if (!courseId) return;
    const input: RuleInput = {
      id: existing?.id,
      courseId,
      domain: domain || null,
      status: status || null,
      priority: Number(priority) || 0,
      isActive,
    };
    adminSaveRule(input);
    onSaved();
  }

  return (
    <Card variant="tint" tint="var(--accent)" className="!p-5">
      <div className="space-y-3">
        <div>
          <label className="label">Course</label>
          <select className="field !w-auto" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-3">
          <div>
            <label className="label">Domain</label>
            <select className="field !w-auto" value={domain} onChange={(e) => setDomain(e.target.value as DomainCode | "")}>
              <option value="">Any domain</option>
              {DOMAINS.map((d) => (
                <option key={d.code} value={d.code}>
                  {domainName(d.code)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="field !w-auto" value={status} onChange={(e) => setStatus(e.target.value as StatusCode | "")}>
              <option value="">Any status</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Priority</label>
            <input type="number" className="field !w-20" value={priority} onChange={(e) => setPriority(e.target.value)} />
          </div>
        </div>
        <label className="flex w-fit items-center gap-2 text-[0.85rem] font-semibold text-ink-2">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          Active
        </label>
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
