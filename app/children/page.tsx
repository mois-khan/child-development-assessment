"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatAge, summariseAge, todayISO } from "@/lib/age";
import { moduleForAge } from "@/content/domains";
import { assessmentsForChild, createChild, listChildren, type SavedChild } from "@/lib/store";
import type { Gender } from "@/lib/types";
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyChildArt,
  Footer,
  IconArrowRight,
  IconCamera,
  IconCheck,
  IconChevronRight,
  IconPlus,
  IconSparkle,
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
  const router = useRouter();
  const [children, setChildren] = useState<SavedChild[] | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const list = listChildren();
    setChildren(list);
    setShowForm(list.length === 0);
  }, []);

  const empty = children !== null && children.length === 0;

  return (
    <>
      <TopBar />

      <main>
        <Section size="sm">
          <Shell width="wide">
            <div className="flex flex-wrap items-end justify-between gap-5">
              <div>
                <p className="eyebrow eyebrow-accent">Your family</p>
                <h1 className="mt-3">
                  {children === null ? "Loading…" : empty ? "Let's add your child" : "Your children"}
                </h1>
                <p className="lede mt-3 max-w-[46ch]">
                  {children === null
                    ? " "
                    : empty
                      ? "Three quick things and we'll find exactly which of the seven stages they're on."
                      : "Pick a child to see their reports, or start a new check."}
                </p>
              </div>
              {!empty && !showForm && children !== null && (
                <Button variant="secondary" onClick={() => setShowForm(true)} iconLeft={<IconPlus size={17} />}>
                  Add a child
                </Button>
              )}
            </div>

            {/* ── the family ───────────────────────────────────────────── */}
            {children !== null && children.length > 0 && (
              <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {children.map((c, i) => (
                  <ChildTile key={c.id} child={c} delay={i * 60} />
                ))}
              </div>
            )}

            {/* ── add form ─────────────────────────────────────────────── */}
            {showForm && (
              <div className="mt-9 grid items-start gap-8 lg:grid-cols-[1.1fr_0.9fr]">
                <NewChildForm
                  onCreated={(child) => router.push(`/children/${child.id}`)}
                  onCancel={children && children.length > 0 ? () => setShowForm(false) : undefined}
                />

                <Card variant="clay" className="hidden overflow-hidden p-8 lg:block">
                  <EmptyChildArt className="mx-auto h-auto w-full max-w-[300px]" />
                  <h3 className="mt-6 text-center">What happens next</h3>
                  <ul className="mt-4 list-none space-y-3 p-0">
                    {[
                      "We work out their exact age in months",
                      "That picks one of the seven brain-development stages",
                      "You answer six short sections built for that stage",
                      "Their report is saved here forever",
                    ].map((line) => (
                      <li key={line} className="flex items-start gap-3">
                        <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-[var(--accent-soft)] text-accent">
                          <IconCheck size={13} />
                        </span>
                        <span className="text-[0.9rem] font-medium leading-relaxed text-ink-2">
                          {line}
                        </span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>
            )}
          </Shell>
        </Section>
      </main>

      <Footer />
    </>
  );
}

/* ══ a child in the family grid ════════════════════════════════════════════ */

function ChildTile({ child, delay }: { child: SavedChild; delay: number }) {
  const router = useRouter();
  const age = summariseAge(child.dob, todayISO(), child.gestationalWeeks);
  const mod = moduleForAge(age.assessedMonths);
  const checks = assessmentsForChild(child.id).length;

  return (
    <button
      type="button"
      onClick={() => router.push(`/children/${child.id}`)}
      className="clay clay-press animate-rise w-full p-5 text-left"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-4">
        <Avatar name={child.name} photoUrl={child.photoUrl} size={62} ring />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[1.15rem] font-extrabold text-ink" style={{ fontFamily: "var(--font-display)" }}>
            {child.name}
          </p>
          <p className="text-[0.85rem] font-semibold text-ink-3">
            {formatAge(age.chronologicalMonths)} old
          </p>
        </div>
        <span className="text-ink-3">
          <IconChevronRight size={20} />
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge tone="accent">
          Module {mod.id} · {mod.name}
        </Badge>
        <Badge tone={checks > 0 ? "success" : "neutral"}>
          {checks === 0 ? "No checks yet" : `${checks} check${checks === 1 ? "" : "s"}`}
        </Badge>
      </div>
    </button>
  );
}

/* ══ create a child ════════════════════════════════════════════════════════ */

function NewChildForm({
  onCreated,
  onCancel,
}: {
  onCreated: (child: SavedChild) => void;
  onCancel?: () => void;
}) {
  const today = todayISO();
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [photoUrl, setPhotoUrl] = useState<string | undefined>();
  const [dobTouched, setDobTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const age = useMemo(() => {
    if (!dob) return null;
    if (new Date(dob) > new Date(today)) return null;
    return summariseAge(dob, today);
  }, [dob, today]);

  const tooOld = age !== null && age.chronologicalMonths > 72;
  const dobInvalid = dobTouched && dob !== "" && age === null;
  const nameOk = name.trim().length > 0;
  const canSubmit = nameOk && dob !== "" && gender !== "" && age !== null && !tooOld;
  const mod = age && !tooOld ? moduleForAge(age.assessedMonths) : null;

  function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoUrl(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setDobTouched(true);
    if (!canSubmit) return;
    setSubmitting(true);
    onCreated(
      createChild({ name: name.trim(), dob, gender: gender as Gender, photoUrl }),
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="clay animate-rise p-6 sm:p-8">
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
          <p className="text-[0.98rem] font-extrabold text-ink">Add a photo</p>
          <p className="hint !mt-1 max-w-[28ch]">
            Optional, and it never leaves this device. It makes the report feel like theirs.
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
            <p className="hint">We work out their age and stage from this — nothing else needed.</p>
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
      </div>

      {/* live confirmation — the parent sees the consequence before committing */}
      {age && !tooOld && mod && (
        <div
          key={mod.id}
          className="animate-rise mt-7 flex items-center gap-4 rounded-[var(--radius)] p-4"
          style={{ background: "var(--accent-soft)" }}
        >
          <Mascot size={54} mood="happy" />
          <p className="text-[0.92rem] leading-relaxed text-ink-2">
            <strong className="font-extrabold text-ink">
              {name.trim() || "Your child"} is {formatAge(age.chronologicalMonths)}
            </strong>{" "}
            — that&rsquo;s{" "}
            <strong className="font-extrabold text-accent">
              Module {mod.id}, {mod.name}
            </strong>
            .
          </p>
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Button
          type="submit"
          size="lg"
          disabled={!canSubmit || submitting}
          iconRight={<IconArrowRight size={18} />}
        >
          {submitting ? "Saving…" : "Save & continue"}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        {!canSubmit && (
          <span className="flex items-center gap-1.5 text-[0.84rem] font-semibold text-ink-3">
            <IconSparkle size={15} /> Name, birthday and gender
          </span>
        )}
      </div>
    </form>
  );
}
