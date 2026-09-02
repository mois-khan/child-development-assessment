"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatAge, todayISO } from "@/lib/age";
import { summariseAge } from "@/lib/age";
import { createChild, listChildren, type SavedChild } from "@/lib/store";
import type { Gender } from "@/lib/types";
import { Avatar, Shell, Tick, TopBar } from "@/components/ui";

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

  return (
    <>
      <TopBar />
      <main className="pb-24">
        <Shell>
          <div className="animate-rise pt-10 sm:pt-14">
            <p className="eyebrow eyebrow-accent">Your family</p>
            <h1 className="mt-3">
              {children === null
                ? "Loading…"
                : children.length === 0
                  ? "Let's add your child"
                  : "Your children"}
            </h1>
            <p className="lede mt-3 max-w-[46ch]">
              {children === null
                ? ""
                : children.length === 0
                  ? "Just three quick things — you can add more children any time."
                  : "Pick a child to continue, or add another one."}
            </p>
          </div>

          {children !== null && children.length > 0 && (
            <div className="animate-rise mt-9 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              {children.map((c) => (
                <ChildTile key={c.id} child={c} />
              ))}

              {!showForm && (
                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  className="card flex min-h-[92px] items-center justify-center gap-2 border-dashed p-5 text-[0.92rem] font-semibold text-accent transition-colors hover:bg-surface-2"
                  style={{ borderColor: "var(--accent-line)" }}
                >
                  <PlusIcon /> Add another child
                </button>
              )}
            </div>
          )}

          {showForm && (
            <div className="mt-9">
              <NewChildForm
                onCreated={(child) => router.push(`/children/${child.id}`)}
                onCancel={
                  children && children.length > 0
                    ? () => setShowForm(false)
                    : undefined
                }
              />
            </div>
          )}
        </Shell>
      </main>
    </>
  );
}

function ChildTile({ child }: { child: SavedChild }) {
  const router = useRouter();
  const age = summariseAge(child.dob, todayISO(), child.gestationalWeeks);
  return (
    <button
      type="button"
      onClick={() => router.push(`/children/${child.id}`)}
      className="card card-raised flex items-center gap-3.5 p-4 text-left transition-transform hover:-translate-y-0.5"
    >
      {child.photoUrl ? (
        <img
          src={child.photoUrl}
          alt={child.name}
          className="size-[46px] shrink-0 rounded-full object-cover"
        />
      ) : (
        <Avatar name={child.name} size={46} />
      )}
      <div className="min-w-0">
        <p className="truncate text-[1rem] font-semibold text-ink">
          {child.name}
        </p>
        <p className="text-[0.82rem] text-ink-3">
          {formatAge(age.chronologicalMonths)} old · Born {formatDob(child.dob)}
        </p>
      </div>
    </button>
  );
}

function formatDob(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

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
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [dobTouched, setDobTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function onPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoUrl(reader.result as string);
    reader.readAsDataURL(file);
  }

  const age = useMemo(() => {
    if (!dob) return null;
    if (new Date(dob) > new Date(today)) return null;
    return summariseAge(dob, today);
  }, [dob, today]);

  const tooOld = age !== null && age.chronologicalMonths > 72;
  const dobInvalid = dobTouched && dob !== "" && age === null;
  const nameOk = name.trim().length > 0;
  const canSubmit = nameOk && dob !== "" && gender !== "" && age !== null && !tooOld;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setDobTouched(true);
    if (!canSubmit) return;
    setSubmitting(true);
    const child = createChild({
      name: name.trim(),
      dob,
      gender: gender as Gender,
      photoUrl,
    });
    onCreated(child);
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="card card-pastel-blue animate-rise space-y-6 !p-6 sm:!p-7"
    >
      <div className="flex items-center gap-4">
        <label
          htmlFor="photo"
          className="relative flex size-16 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed"
          style={{ borderColor: "var(--accent-line)", background: "var(--surface)" }}
        >
          {photoUrl ? (
            <img src={photoUrl} alt="" className="size-full object-cover" />
          ) : (
            <CameraIcon />
          )}
          <input
            id="photo"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={onPhotoChange}
          />
        </label>
        <div>
          <p className="text-[0.85rem] font-semibold text-ink">Add a photo</p>
          <p className="hint !mt-0.5">Optional — makes the profile feel more like them.</p>
        </div>
      </div>

      <div>
        <label className="label" htmlFor="name">
          Child&rsquo;s first name
        </label>
        <div className="relative">
          <input
            id="name"
            className={`field ${nameOk ? "field-valid pr-10" : ""}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Aarav"
            autoComplete="off"
          />
          {nameOk && (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
              <Tick size={17} />
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
          className={`field ${dobInvalid ? "field-error" : age ? "field-valid" : ""}`}
          value={dob}
          max={today}
          onChange={(e) => setDob(e.target.value)}
          onBlur={() => setDobTouched(true)}
        />
        <p className="hint">We work out their age from this — no need to enter it separately.</p>
        {tooOld && (
          <p className="hint hint-error">
            This programme covers ages 0–6. For an older child, speak to their school or your doctor.
          </p>
        )}
      </div>

      <fieldset className="border-0 p-0">
        <legend className="label">Gender</legend>
        <div className="flex flex-wrap gap-2">
          {GENDERS.map(([value, label]) => {
            const on = gender === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setGender(value)}
                aria-pressed={on}
                className="btn btn-sm"
                style={
                  on
                    ? {
                        background: "var(--accent)",
                        borderColor: "var(--accent)",
                        color: "var(--on-status)",
                      }
                    : {
                        background: "var(--surface)",
                        borderColor: "var(--line)",
                        color: "var(--ink-2)",
                      }
                }
              >
                {on && <Tick size={13} color="var(--on-status)" />}
                {label}
              </button>
            );
          })}
        </div>
      </fieldset>

      {age && !tooOld && (
        <p className="text-[0.85rem] font-medium text-ink-2">
          {name.trim() || "Your child"} is{" "}
          <strong className="text-ink">{formatAge(age.chronologicalMonths)}</strong> old — got it! 🎉
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button type="submit" className="btn btn-primary" disabled={!canSubmit || submitting}>
          {submitting ? "Saving…" : "Save & continue"}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-quiet" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

function CameraIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M3 7.5a1 1 0 0 1 1-1h1.3l.7-1.2a1 1 0 0 1 .87-.5h2.26a1 1 0 0 1 .87.5l.7 1.2H16a1 1 0 0 1 1 1v6.8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7.5Z"
        stroke="var(--accent)"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="10.5" r="2.6" stroke="var(--accent)" strokeWidth="1.4" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
