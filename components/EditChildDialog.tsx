"use client";

import { useEffect, useMemo, useState } from "react";
import { formatAge, summariseAge, todayISO } from "@/lib/age";
import { stageForAge } from "@/lib/stage";
import { phaseLabel } from "@/lib/naming";
import { deleteChild, updateChild, type SavedChild } from "@/lib/store";
import type { Gender } from "@/lib/types";
import { Button, Card, IconCheck } from "@/components/ui";

const GENDERS: [Gender, string][] = [
  ["girl", "Girl"],
  ["boy", "Boy"],
  ["other", "Prefer not to say"],
];

/**
 * Edit or remove one child.
 *
 * Date of birth is the reason this exists. Every phase, every question asked
 * and every verdict in the report is derived from it, so a typo at signup
 * produced a permanently wrong report with no way to correct it — the data
 * layer has had updateChild() and deleteChild() since day one and nothing in
 * the interface ever called them.
 *
 * Because DOB drives scoring, changing it does NOT retro-fit existing
 * reports: those were scored against the answers actually given at the time,
 * and silently re-scoring history would change a document a parent may have
 * already shown a doctor. The warning below says so plainly rather than
 * leaving a parent to discover it.
 */
export function EditChildDialog({
  child,
  onSaved,
  onDeleted,
  onClose,
}: {
  child: SavedChild;
  onSaved: (updated: SavedChild) => void;
  onDeleted: () => void;
  onClose: () => void;
}) {
  const today = todayISO();
  const [name, setName] = useState(child.name);
  const [dob, setDob] = useState(child.dob);
  const [gender, setGender] = useState<Gender>(child.gender);
  const [phone, setPhone] = useState(child.parentPhone ?? "");
  const [email, setEmail] = useState(child.parentEmail ?? "");
  const [city, setCity] = useState(child.city ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteTyped, setDeleteTyped] = useState("");

  // Escape closes, and the page behind must not scroll while this is open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  const age = useMemo(() => {
    if (!dob || new Date(dob) > new Date(today)) return null;
    return summariseAge(dob, today);
  }, [dob, today]);

  const tooOld = age !== null && age.chronologicalMonths > 72;
  const dobChanged = dob !== child.dob;
  const canSave = name.trim().length > 0 && dob !== "" && age !== null && !tooOld && !saving;
  const phase = age && !tooOld ? stageForAge(age.assessedMonths) : null;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    setError("");
    try {
      await updateChild(child.id, {
        name: name.trim(),
        dob,
        gender,
        parentPhone: phone.trim() || undefined,
        parentEmail: email.trim() || undefined,
        city: city.trim() || undefined,
      });
      onSaved({
        ...child,
        name: name.trim(),
        dob,
        gender,
        parentPhone: phone.trim() || undefined,
        parentEmail: email.trim() || undefined,
        city: city.trim() || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save those changes.");
      setSaving(false);
    }
  }

  async function handleDelete() {
    setSaving(true);
    setError("");
    try {
      await deleteChild(child.id);
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't remove this child.");
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-child-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <Card variant="clay" className="my-8 w-full max-w-[34rem] !p-6 sm:!p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow eyebrow-accent">Edit details</p>
            <h2 id="edit-child-title" className="mt-2 !text-xl">
              {child.name}
            </h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        {confirmDelete ? (
          <div className="mt-6">
            <div
              className="rounded-[var(--radius)] px-4 py-3"
              style={{
                background: "var(--st-significant-soft)",
                color: "var(--st-significant-ink)",
              }}
            >
              <p className="text-sm font-bold">
                This removes {child.name} and every report they have.
              </p>
              <p className="mt-1 text-sm">
                Their assessments and answers go with them. This cannot be undone, and support
                cannot recover it.
              </p>
            </div>

            <label className="label mt-5 block" htmlFor="confirmName">
              Type <strong className="font-extrabold">{child.name}</strong> to confirm
            </label>
            <input
              id="confirmName"
              className="field"
              value={deleteTyped}
              onChange={(e) => setDeleteTyped(e.target.value)}
              autoComplete="off"
            />

            {error && (
              <p className="mt-3 text-sm font-semibold text-[var(--st-delay)]">{error}</p>
            )}

            <div className="mt-5 flex flex-wrap gap-3">
              <Button
                onClick={handleDelete}
                disabled={deleteTyped.trim() !== child.name || saving}
                style={{ background: "var(--st-significant)", color: "#fff" }}
              >
                {saving ? "Removing…" : `Remove ${child.name}`}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setConfirmDelete(false);
                  setDeleteTyped("");
                  setError("");
                }}
              >
                Keep {child.name}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} noValidate className="mt-6 space-y-5">
            <div>
              <label className="label" htmlFor="editName">
                Child&rsquo;s name
              </label>
              <input
                id="editName"
                className="field"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="off"
              />
            </div>

            <div>
              <label className="label" htmlFor="editDob">
                Date of birth
              </label>
              <input
                id="editDob"
                type="date"
                className="field"
                value={dob}
                max={today}
                onChange={(e) => setDob(e.target.value)}
              />
              {phase && (
                <p className="hint">
                  {formatAge(age!.chronologicalMonths)} · {phaseLabel(phase)}
                </p>
              )}
              {tooOld && (
                <p className="hint hint-error">
                  This check covers children up to six years old.
                </p>
              )}
              {dobChanged && !tooOld && age !== null && (
                <div
                  className="mt-2 rounded-[var(--radius-sm)] px-3 py-2 text-sm"
                  style={{ background: "var(--st-mild-soft)", color: "var(--st-mild-ink)" }}
                >
                  Reports already saved keep the age they were scored at. Only new checks will
                  use this date.
                </div>
              )}
            </div>

            <fieldset>
              <legend className="label">Gender</legend>
              <div className="mt-1 flex flex-wrap gap-2">
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

            <div>
              <label className="label" htmlFor="editPhone">
                Phone number <span className="font-normal text-ink-3">(optional)</span>
              </label>
              <input
                id="editPhone"
                type="tel"
                className="field"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
              />
            </div>

            <div>
              <label className="label" htmlFor="editEmail">
                Email <span className="font-normal text-ink-3">(optional)</span>
              </label>
              <input
                id="editEmail"
                type="email"
                className="field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div>
              <label className="label" htmlFor="editCity">
                City <span className="font-normal text-ink-3">(optional)</span>
              </label>
              <input
                id="editCity"
                className="field"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                autoComplete="address-level2"
              />
            </div>

            {error && <p className="text-sm font-semibold text-[var(--st-delay)]">{error}</p>}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
              <div className="flex gap-3">
                <Button type="submit" disabled={!canSave}>
                  {saving ? "Saving…" : "Save changes"}
                </Button>
                <Button type="button" variant="secondary" onClick={onClose}>
                  Cancel
                </Button>
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setConfirmDelete(true)}
                className="!text-[var(--st-delay)]"
              >
                Remove child
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
