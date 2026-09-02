"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DOMAINS } from "@/content/domains";
import { itemsFor } from "@/content/items";
import { formatAge, summariseAge, todayISO } from "@/lib/age";
import { initialWindow } from "@/lib/scoring";
import { createAssessment } from "@/lib/store";
import type { DomainCode, Gender } from "@/lib/types";
import { Shell, Tick, TopBar } from "@/components/ui";

const GENDERS: [Gender, string][] = [
  ["girl", "Girl"],
  ["boy", "Boy"],
  ["other", "Prefer not to say"],
];

export default function StartPage() {
  const router = useRouter();
  const today = todayISO();

  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [assessedOn, setAssessedOn] = useState(today);
  const [preterm, setPreterm] = useState(false);
  const [weeks, setWeeks] = useState("");
  const [dobTouched, setDobTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const weeksNum = weeks === "" ? null : Number(weeks);
  const weeksValid = weeksNum !== null && weeksNum >= 22 && weeksNum <= 36;
  const gestationalWeeks = preterm && weeksValid ? weeksNum : undefined;

  const age = useMemo(() => {
    if (!dob || !assessedOn) return null;
    if (new Date(dob) > new Date(assessedOn)) return null;
    return summariseAge(dob, assessedOn, gestationalWeeks);
  }, [dob, assessedOn, gestationalWeeks]);

  const tooOld = age !== null && age.assessedMonths > 72;
  const dobInvalid = dobTouched && dob !== "" && age === null;

  const questionCount = useMemo(() => {
    if (!age || tooOld) return 0;
    return initialWindow(age.assessedMonths).reduce(
      (n, b) => n + DOMAINS.reduce((k, d) => k + itemsFor(b.id, d.code).length, 0),
      0,
    );
  }, [age, tooOld]);

  const nameOk = name.trim().length > 0;
  const canSubmit =
    nameOk &&
    dob !== "" &&
    gender !== "" &&
    age !== null &&
    !tooOld &&
    (!preterm || weeksValid);

  // Naming what is still missing beats a disabled button with no explanation.
  const missing: string[] = [];
  if (!nameOk) missing.push("a name");
  if (!dob || age === null) missing.push("a date of birth");
  if (gender === "") missing.push("gender");
  if (preterm && !weeksValid) missing.push("weeks at birth");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setDobTouched(true);
    if (!canSubmit || !age) return;
    setSubmitting(true);

    const window = initialWindow(age.assessedMonths);
    const bandsByDomain = Object.fromEntries(
      DOMAINS.map((d) => [d.code, window.map((b) => b.id)]),
    ) as Record<DomainCode, string[]>;

    const record = createAssessment(
      { name: name.trim(), dob, gender: gender as Gender, gestationalWeeks },
      assessedOn,
      bandsByDomain,
    );
    router.push(`/assessment/${record.id}`);
  }

  return (
    <>
      <TopBar
        right={
          <Link href="/" className="btn btn-quiet btn-sm">
            Cancel
          </Link>
        }
      />

      <main className="pb-28">
        <Shell>
          <div className="animate-rise pt-10 sm:pt-14">
            <p className="eyebrow eyebrow-accent">Step 1 of 2</p>
            <h1 className="mt-4">About your child</h1>
            <p className="lede mt-3 max-w-[46ch]">
              We use their date of birth to choose the right questions, so
              please give it exactly rather than rounding.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-10 space-y-7" noValidate>
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
              <p className="hint">Used in the report so it reads naturally.</p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="dob">
                  Date of birth
                </label>
                <input
                  id="dob"
                  type="date"
                  className={`field ${dobInvalid ? "field-error" : age ? "field-valid" : ""}`}
                  value={dob}
                  max={assessedOn}
                  onChange={(e) => setDob(e.target.value)}
                  onBlur={() => setDobTouched(true)}
                />
                {dobInvalid && (
                  <p className="hint hint-error">
                    That date falls after the assessment date. Please check it.
                  </p>
                )}
              </div>

              <div>
                <label className="label" htmlFor="assessedOn">
                  Assessment date
                </label>
                <input
                  id="assessedOn"
                  type="date"
                  className="field"
                  value={assessedOn}
                  onChange={(e) => setAssessedOn(e.target.value)}
                />
              </div>
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
                              background: "var(--pine-soft)",
                              borderColor: "var(--pine)",
                              color: "var(--pine)",
                            }
                          : {
                              background: "var(--surface)",
                              borderColor: "var(--line)",
                              color: "var(--ink-2)",
                            }
                      }
                    >
                      {on && <Tick size={14} />}
                      {label}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="card p-4">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={preterm}
                  onChange={(e) => setPreterm(e.target.checked)}
                  className="mt-[3px] size-4 shrink-0 appearance-none rounded-[4px] border border-line bg-surface bg-center bg-no-repeat checked:border-[var(--pine)] checked:bg-[var(--pine)]"
                  style={
                    preterm
                      ? {
                          backgroundImage:
                            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none'%3E%3Cpath d='M4.5 10.5 8.2 14.2 15.5 6.5' stroke='white' stroke-width='2.6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
                          backgroundSize: "13px",
                        }
                      : undefined
                  }
                />
                <span>
                  <span className="block text-[0.92rem] font-semibold text-ink">
                    Born before 37 weeks
                  </span>
                  <span className="hint !mt-1 block">
                    Babies born early develop on their corrected age, not their
                    birth date. Telling us means the report compares them
                    fairly.
                  </span>
                </span>
              </label>

              {preterm && (
                <div className="animate-rise mt-4 max-w-[15rem] border-t border-line-soft pt-4">
                  <label className="label" htmlFor="weeks">
                    Weeks of pregnancy at birth
                  </label>
                  <input
                    id="weeks"
                    type="number"
                    min={22}
                    max={36}
                    className={`field ${weeksValid ? "field-valid" : weeks !== "" ? "field-error" : ""}`}
                    value={weeks}
                    onChange={(e) => setWeeks(e.target.value)}
                    placeholder="32"
                  />
                  {weeks !== "" && !weeksValid && (
                    <p className="hint hint-error">
                      Please enter a number between 22 and 36.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Live confirmation: the parent sees the consequence of what they
                typed before they commit to seventy questions. */}
            {age && !tooOld && (
              <div
                key={`${age.assessedMonths}-${age.corrected}`}
                className="animate-rise rounded-[12px] border p-5"
                style={{
                  borderColor: "var(--pine-line)",
                  background: "var(--pine-soft)",
                }}
                role="status"
              >
                <p className="eyebrow eyebrow-accent">Ready to begin</p>
                <p
                  className="mt-2 text-[1.15rem] leading-snug text-ink"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {name.trim() || "Your child"} is{" "}
                  <strong className="font-semibold">
                    {formatAge(age.chronologicalMonths)}
                  </strong>{" "}
                  old.
                </p>
                <p className="mt-2 text-[0.88rem] leading-relaxed text-ink-2">
                  {age.corrected && (
                    <>
                      Born early, so we&rsquo;ll assess against a corrected age
                      of{" "}
                      <strong className="font-semibold text-ink">
                        {formatAge(age.assessedMonths)}
                      </strong>
                      .{" "}
                    </>
                  )}
                  That&rsquo;s{" "}
                  <strong className="font-semibold text-ink tnum">
                    {questionCount} questions
                  </strong>{" "}
                  across six areas, covering the months just before, at, and
                  after their age.
                </p>
              </div>
            )}

            {tooOld && (
              <div
                className="animate-rise rounded-[12px] border p-5"
                style={{
                  borderColor: "var(--st-consult)",
                  background: "var(--st-consult-soft)",
                }}
                role="alert"
              >
                <p className="text-[0.92rem] leading-relaxed text-ink">
                  This check covers children up to six years old. For an older
                  child, speak to their school or your doctor.
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!canSubmit || submitting}
              >
                {submitting ? "Preparing questions…" : "Begin the questions"}
              </button>
              {!canSubmit && missing.length > 0 && (
                <span className="text-[0.83rem] text-ink-3">
                  Still needs {formatList(missing)}
                </span>
              )}
            </div>
          </form>
        </Shell>
      </main>
    </>
  );
}

function formatList(items: string[]): string {
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}
