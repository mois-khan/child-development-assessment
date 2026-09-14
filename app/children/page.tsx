"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatAge, summariseAge, todayISO } from "@/lib/age";
import { useAuth } from "@/lib/auth/provider";
import { phaseLabel } from "@/lib/naming";
import { stageForAge } from "@/lib/stage";
import { assessmentsForChild, createChild, listChildren, type SavedChild } from "@/lib/store";
import type { Gender } from "@/lib/types";
import {
  Avatar,
  Badge,
  Blooms,
  Button,
  ButtonLink,
  EmptyChildArt,
  Footer,
  IconArrowRight,
  IconBolt,
  IconCamera,
  IconCheck,
  IconChevronRight,
  IconClock,
  IconPlus,
  IconSparkle,
  IconStarFilled,
  LoadError,
  Mascot,
  Section,
  Shell,
  TopBar,
} from "@/components/ui";

const GENDERS: [Gender, string][] = [
  ["girl", "Girl"],
  ["boy", "Boy"],
];

export default function ChildrenPage() {
  return (
    <Suspense fallback={null}>
      <ChildrenPageInner />
    </Suspense>
  );
}

function ChildrenPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // A parent clicking "Add a child" elsewhere in the app (their profile, an
  // empty dashboard) wants the creation form, not this list with one more
  // click still between them and it — so `?new=1` opens it immediately, the
  // moment the roster load below confirms whether it's even needed.
  const openOnLoad = searchParams.get("new") === "1";
  const { profile } = useAuth();
  const isSchool = profile?.accountType === "school";
  const [children, setChildren] = useState<SavedChild[] | null | "error">(null);
  const [showForm, setShowForm] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setChildren(null);
    listChildren()
      .then(list => {
        if (!active) return;
        setChildren(list);
        setShowForm(list.length === 0 || openOnLoad);
      })
      .catch(() => {
        if (active) setChildren("error");
      });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadAttempt]);

  const list = children !== null && children !== "error" ? children : null;
  const empty = list !== null && list.length === 0;

  if (children === "error") {
    return (
      <>
        <TopBar />
        <Shell width="narrow">
          <LoadError onRetry={() => setLoadAttempt((n) => n + 1)} />
        </Shell>
        <Footer />
      </>
    );
  }

  return (
    <>
      <TopBar />

      <main className="pb-6">
        {/* ══ header ═══════════════════════════════════════════════════════ */}
        <div className="relative overflow-hidden border-b border-line-soft">
          <Blooms />
          <Shell width="wide" className="relative">
            <div className="flex flex-wrap items-end justify-between gap-6 py-10 sm:py-12">
              <div className="min-w-0">
                <p className="eyebrow eyebrow-accent">Your family</p>
                <h1 className="mt-3">
                  {children === null
                    ? "Loading…"
                    : empty
                      ? "Let's add your child"
                      : list!.length === 1
                        ? "Your child"
                        : "Your children"}
                </h1>
                <p className="lede mt-3 max-w-[48ch]">
                  {empty
                    ? "Three quick things and we'll find exactly which of the seven phases they're on."
                    : "Each child keeps their own phase, their own checks and their own reports."}
                </p>
              </div>

              {list !== null && list.length > 0 && (
                <div className="flex flex-wrap items-center gap-3">
                  <FamilyCount count={list.length} />
                  <Button
                    variant="secondary"
                    onClick={() => setShowForm(true)}
                    iconLeft={<IconPlus size={17} />}
                  >
                    Add a child
                  </Button>
                </div>
              )}
            </div>
          </Shell>
        </div>

        <Section size="sm">
          <Shell width="wide">
            {/* ── the family ─────────────────────────────────────────────── */}
            {children === null ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-[218px] animate-pulse rounded-[var(--radius-xl)] bg-surface-3" />
                ))}
              </div>
            ) : list!.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {list!.map((c, i) => (
                  <ChildTile key={c.id} child={c} delay={i * 60} />
                ))}

                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  className="animate-rise flex min-h-[218px] flex-col items-center justify-center gap-3 rounded-[var(--radius-xl)] border-2 border-dashed p-6 transition-colors"
                  style={{
                    borderColor: "var(--accent-line)",
                    background: "var(--accent-soft)",
                    animationDelay: `${list!.length * 60}ms`,
                  }}
                >
                  <span className="grid size-14 place-items-center rounded-full bg-[var(--surface)] text-accent shadow-[var(--clay-sm)]">
                    <IconPlus size={26} />
                  </span>
                  <span className="text-base font-extrabold text-accent">Add another child</span>
                  <span className="max-w-[24ch] text-center text-sm text-ink-3">
                    Siblings each get their own phase and report.
                  </span>
                </button>
              </div>
            ) : (
              <div className="animate-rise mx-auto flex max-w-[26rem] flex-col items-center py-6 text-center">
                <EmptyChildArt className="h-auto w-full max-w-[260px]" />
                <Button
                  size="lg"
                  className="mt-8"
                  onClick={() => setShowForm(true)}
                  iconRight={<IconArrowRight size={18} />}
                >
                  Add your child
                </Button>
              </div>
            )}
          </Shell>
        </Section>
      </main>

      {showForm && (
        <NewChildDialog
          isSchool={isSchool}
          onCreated={(child) => router.push(`/children/${child.id}`)}
          onClose={() => {
            setShowForm(false);
            setLoadAttempt((n) => n + 1);
            // Drop `?new=1` once the dialog's been seen, so a later visit to
            // this same URL (back button, a bookmark) doesn't reopen it.
            if (openOnLoad) router.replace("/children");
          }}
        />
      )}

      <Footer />
    </>
  );
}

/* ══ the family count pill ═════════════════════════════════════════════════ */

function FamilyCount({ count }: { count: number }) {
  return (
    <div
      className="flex items-center gap-3 rounded-full px-4 py-2.5"
      style={{ background: "var(--surface)", boxShadow: "var(--clay-sm)" }}
    >
      <span className="grid size-8 place-items-center rounded-full bg-[var(--accent-soft)] text-accent">
        <IconStarFilled size={16} />
      </span>
      <span className="tnum text-sm font-extrabold text-ink">
        {count} {count === 1 ? "child" : "children"}
      </span>
    </div>
  );
}

/* ══ a child in the family grid ════════════════════════════════════════════ */

function ChildTile({ child, delay }: { child: SavedChild; delay: number }) {
  const router = useRouter();
  const [state, setState] = useState<{ done: number; openId: string | null } | null>(null);
  const age = summariseAge(child.dob, todayISO(), child.gestationalWeeks);
  const stage = stageForAge(age.assessedMonths);

  useEffect(() => {
    let active = true;
    assessmentsForChild(child.id).then(list => {
      if (!active) return;
      setState({
        done: list.filter((a) => a.completedAt).length,
        openId: list.find((a) => !a.completedAt)?.id ?? null,
      });
    });
    return () => { active = false; };
  }, [child.id]);

  // The card's spine says what this child needs at a glance, before any label
  // is read: amber for a check waiting to be finished, green for a report
  // ready to open, brand tint for a child who hasn't started.
  const spine = !state
    ? "var(--line)"
    : state.openId
      ? "var(--sun-500)"
      : state.done > 0
        ? "var(--st-on-track)"
        : "var(--accent-line)";

  return (
    <article
      className="clay animate-rise lift flex flex-col overflow-hidden !p-0"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="h-1.5 w-full" style={{ background: spine }} />

      <button
        type="button"
        onClick={() => router.push(`/children/${child.id}`)}
        className="clay-press flex flex-1 flex-col p-5 text-left"
      >
        <div className="flex items-center gap-4">
          <Avatar name={child.name} photoUrl={child.photoUrl} size={62} ring />
          <div className="min-w-0 flex-1">
            <p
              className="truncate text-lg font-extrabold text-ink"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {child.name}
            </p>
            <p className="text-sm font-semibold text-ink-3">{formatAge(age.chronologicalMonths)}</p>
            <p className="text-xs font-medium text-ink-3">born {formatDate(child.dob)}</p>
          </div>
          <span className="text-ink-3">
            <IconChevronRight size={20} />
          </span>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge tone="accent">{phaseLabel(stage)}</Badge>
          {!state ? (
            <Badge tone="neutral">Loading…</Badge>
          ) : state.openId ? (
            <Badge tone="sun" icon={<IconClock size={12} />}>
              Check unfinished
            </Badge>
          ) : state.done > 0 ? (
            <Badge tone="success" icon={<IconCheck size={12} />}>
              {state.done} report{state.done === 1 ? "" : "s"}
            </Badge>
          ) : (
            <Badge tone="neutral">No checks yet</Badge>
          )}
        </div>
      </button>

      {/* The action lives outside the card-wide button — nesting a button
          inside a button is invalid HTML and breaks keyboard navigation. */}
      <div className="border-t border-line-soft px-5 py-3.5">
        {!state ? (
          <div className="h-8 animate-pulse rounded-full bg-surface-3" />
        ) : state.openId ? (
          <ButtonLink
            href={`/assessment/${state.openId}`}
            size="sm"
            block
            iconLeft={<IconBolt size={15} />}
          >
            Resume the check
          </ButtonLink>
        ) : (
          <ButtonLink
            href={`/children/${child.id}/pay`}
            variant="secondary"
            size="sm"
            block
            iconRight={<IconArrowRight size={15} />}
          >
            {state.done > 0 ? "Check again" : "Start the check"}
          </ButtonLink>
        )}
      </div>
    </article>
  );
}

/* ══ create a child — a modal, not an inline form ══════════════════════════ */

function NewChildDialog({
  isSchool,
  onCreated,
  onClose,
}: {
  isSchool: boolean;
  onCreated: (child: SavedChild) => void;
  onClose: () => void;
}) {
  // Escape closes, and the page behind must not scroll while this is open —
  // same contract as EditChildDialog.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    // Lock both html and body — body alone leaves html as the page's real
    // scrolling element on some engines, so the underlying page (taller than
    // the viewport here) stays scrollable behind the fixed overlay.
    const previousBody = document.body.style.overflow;
    const previousHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousBody;
      document.documentElement.style.overflow = previousHtml;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-child-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[32rem] lg:max-w-[38rem]">
        <NewChildForm isSchool={isSchool} onCreated={onCreated} onCancel={onClose} />
      </div>
    </div>
  );
}

function NewChildForm({
  isSchool,
  onCreated,
  onCancel,
}: {
  isSchool: boolean;
  onCreated: (child: SavedChild) => void;
  onCancel?: () => void;
}) {
  const today = todayISO();
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [photoUrl, setPhotoUrl] = useState<string | undefined>();
  const [dobTouched, setDobTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // A school adds a whole class in one sitting — each save should clear the
  // form for the next student rather than leaving the dialog, so this tracks
  // who's gone in so far without needing to leave and reopen it per child.
  const [added, setAdded] = useState<SavedChild[]>([]);

  const age = useMemo(() => {
    if (!dob) return null;
    if (new Date(dob) > new Date(today)) return null;
    return summariseAge(dob, today);
  }, [dob, today]);

  const tooOld = age !== null && age.chronologicalMonths > 72;
  const dobInvalid = dobTouched && dob !== "" && age === null;
  const nameOk = name.trim().length > 0;
  const canSubmit = nameOk && dob !== "" && gender !== "" && age !== null && !tooOld;
  const stage = age && !tooOld ? stageForAge(age.assessedMonths) : null;

  function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoUrl(reader.result as string);
    reader.readAsDataURL(file);
  }

  function resetForNextStudent() {
    setName("");
    setDob("");
    setGuardianName("");
    setEmail("");
    setPhone("");
    setGender("");
    setPhotoUrl(undefined);
    setDobTouched(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setDobTouched(true);
    if (!canSubmit) return;
    setSubmitting(true);
    const child = await createChild({
      name: name.trim(),
      dob,
      gender: gender as Gender,
      photoUrl,
      parentName: isSchool ? guardianName.trim() || undefined : undefined,
      parentPhone: isSchool ? phone.trim() || undefined : undefined,
      parentEmail: email.trim() || undefined,
    });
    if (isSchool) {
      setAdded((prev) => [...prev, child]);
      resetForNextStudent();
      setSubmitting(false);
    } else {
      onCreated(child);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="clay animate-rise flex max-h-[90vh] flex-col overflow-hidden !p-0"
    >
      <div
        className="shrink-0 px-6 py-5 sm:px-8"
        style={{ background: "linear-gradient(120deg, var(--brand-600), var(--brand-500))" }}
      >
        <h2 id="new-child-title" className="!text-xl text-white">
          {isSchool ? "Add a student" : "A new child"}
        </h2>
      </div>

      {isSchool && added.length > 0 && (
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-line-soft bg-[var(--accent-soft)] px-6 py-3 sm:px-8">
          <IconCheck size={15} className="shrink-0 text-accent" />
          <p className="text-sm font-semibold text-ink-2">
            {added.length} student{added.length === 1 ? "" : "s"} added so far:{" "}
            <span className="font-normal text-ink-3">{added.map((c) => c.name).join(", ")}</span>
          </p>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto p-6 sm:p-8">
        {/* photo */}
        <div className="flex items-center gap-5">
          <label
            htmlFor="photo"
            className="clay-press relative grid size-[84px] shrink-0 cursor-pointer place-items-center overflow-hidden rounded-full border-2 border-dashed"
            style={{ borderColor: "var(--accent-line)", background: "var(--accent-soft)" }}
          >
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl} alt="" className="size-full object-cover" />
            ) : (
              <span className="text-accent">
                <IconCamera size={28} />
              </span>
            )}
            <input id="photo" type="file" accept="image/*" className="sr-only" onChange={onPhoto} />
          </label>
          <div>
            <p className="text-base font-extrabold text-ink">Add a photo</p>
            <p className="hint !mt-1 max-w-[28ch]">
              Optional; it makes the report feel like theirs. Only you and admins reviewing
              the account can see it.
            </p>
          </div>
        </div>

        <div className="mt-7 space-y-6">
          <div>
            <label className="label" htmlFor="name">
              Child&rsquo;s first name
            </label>
            <div className="relative">
              <input
                id="name"
                className={`field ${nameOk ? "field-valid pr-11" : ""}`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Aarav"
                autoComplete="off"
              />
              {nameOk && (
                <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--st-on-track)]">
                  <IconCheck size={19} />
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="label" htmlFor="dob">
              Date of birth
            </label>
            <input
              id="dob"
              type="date"
              className={`field ${dobInvalid || tooOld ? "field-error" : age ? "field-valid" : ""}`}
              value={dob}
              max={today}
              onChange={(e) => setDob(e.target.value)}
              onBlur={() => setDobTouched(true)}
            />
            {tooOld ? (
              <p className="hint hint-error">
                This programme covers ages 0–6. For an older child, ask us about the 6–15 years
                programme.
              </p>
            ) : (
              <p className="hint">We work out their age and phase from this; nothing else needed.</p>
            )}
          </div>

          <fieldset className="border-0 p-0">
            <legend className="label">Gender</legend>
            <div className="flex flex-wrap gap-2.5">
              {GENDERS.map(([value, label]) => {
                const on = gender === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setGender(value)}
                    aria-pressed={on}
                    className={`btn btn-sm ${on ? "btn-primary" : "btn-secondary"}`}
                  >
                    {on && <IconCheck size={15} />}
                    {label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          {isSchool ? (
            // A school's own login is one account for the whole roster, so
            // each student needs their own guardian on record — shown right
            // here, not tucked behind an edit screen after the fact.
            <div className="space-y-5 rounded-[var(--radius)] border border-line-soft p-4 sm:p-5">
              <p className="text-sm font-extrabold text-ink">Guardian details</p>
              <div>
                <label className="label" htmlFor="guardianName">
                  Guardian&rsquo;s name <span className="font-normal text-ink-3">(optional)</span>
                </label>
                <input
                  id="guardianName"
                  className="field"
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  placeholder="Priya Sharma"
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="label" htmlFor="guardianPhone">
                  Guardian&rsquo;s mobile <span className="font-normal text-ink-3">(optional)</span>
                </label>
                <input
                  id="guardianPhone"
                  type="tel"
                  className="field"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="98765 43210"
                  autoComplete="tel"
                />
              </div>
              <div>
                <label className="label" htmlFor="guardianEmail">
                  Guardian&rsquo;s email <span className="font-normal text-ink-3">(optional)</span>
                </label>
                <input
                  id="guardianEmail"
                  type="email"
                  className="field"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="priya@example.com"
                  autoComplete="email"
                />
                <p className="hint">If the report should go straight to the family too.</p>
              </div>
            </div>
          ) : (
            <div>
              <label className="label" htmlFor="childEmail">
                Email <span className="font-normal text-ink-3">(optional)</span>
              </label>
              <input
                id="childEmail"
                type="email"
                className="field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="priya@example.com"
                autoComplete="email"
              />
              <p className="hint">Only if the report should go somewhere other than your account.</p>
            </div>
          )}
        </div>

        {/* live confirmation — the parent sees the consequence before committing */}
        {age && !tooOld && stage && (
          <div
            key={stage.id}
            className="animate-rise mt-7 flex items-center gap-4 rounded-[var(--radius)] p-4"
            style={{ background: "var(--accent-soft)" }}
          >
            <Mascot size={54} mood="happy" />
            <p className="text-sm leading-relaxed text-ink-2">
              <strong className="font-extrabold text-ink">
                {name.trim() || (isSchool ? "This student" : "Your child")} is{" "}
                {formatAge(age.chronologicalMonths)}
              </strong>{" "}
              , that&rsquo;s{" "}
              <strong className="font-extrabold text-accent">{phaseLabel(stage)}</strong>.
            </p>
          </div>
        )}
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-3 border-t border-line-soft bg-[var(--surface)] p-6 sm:px-8 sm:py-5">
        <Button
          type="submit"
          size="lg"
          disabled={!canSubmit || submitting}
          iconRight={<IconArrowRight size={18} />}
        >
          {submitting ? "Saving…" : isSchool ? "Save & add another" : "Save & continue"}
        </Button>
        {isSchool && added.length > 0 && (
          <Button type="button" variant="secondary" onClick={onCancel} iconLeft={<IconCheck size={16} />}>
            Done — back to roster
          </Button>
        )}
        {onCancel && (!isSchool || added.length === 0) && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        {!canSubmit && (
          <span className="flex items-center gap-1.5 text-sm font-semibold text-ink-3">
            <IconSparkle size={15} /> Name, birthday and gender
          </span>
        )}
      </div>
    </form>
  );
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
