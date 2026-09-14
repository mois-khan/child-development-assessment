"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { adminGetParentProfile, type ParentProfile } from "@/lib/admin/parents";
import type { LeadStatus } from "@/lib/admin/leads";
import {
  Avatar,
  Badge,
  Card,
  CopyButton,
  IconArrowRight,
  IconCalendar,
  IconCheck,
  IconClock,
  IconClose,
  IconMail,
  IconPhone,
  IconRefresh,
  IconTrophy,
  IconUsers,
} from "@/components/ui";

const STATUS_TONE: Record<LeadStatus, "neutral" | "accent" | "success" | "danger" | "warn"> = {
  new: "accent",
  contacted: "neutral",
  interested: "success",
  follow_up: "warn",
  converted: "success",
  not_interested: "danger",
  lost: "danger",
};

const STATUS_LABEL: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  interested: "Interested",
  follow_up: "Follow Up",
  converted: "Converted",
  not_interested: "Not Interested",
  lost: "Lost",
};

/**
 * The complete picture of one parent — contact details (each with a copy
 * button, since these get pasted into WhatsApp/dialers all day), and every
 * child they've added with whatever assessment progress that child has.
 *
 * A popup rather than its own page: an admin is usually scanning the Parents
 * list, not managing this one record, so leaving that list in place behind
 * the overlay matters more than a shareable URL would.
 */
export function ParentProfileModal({
  profileId,
  onClose,
}: {
  profileId: string;
  onClose: () => void;
}) {
  const [profile, setProfile] = useState<ParentProfile | null | undefined>(undefined);
  const [timedOut, setTimedOut] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let active = true;
    setProfile(undefined);
    setTimedOut(false);

    // A dropped connection otherwise leaves the spinner running forever —
    // the fetch never resolves and never rejects, so nothing else here
    // would catch it.
    const timeout = window.setTimeout(() => {
      if (active) setTimedOut(true);
    }, 12000);

    adminGetParentProfile(profileId)
      .then((p) => { if (active) setProfile(p); })
      .catch(() => { if (active) setProfile(null); })
      .finally(() => window.clearTimeout(timeout));

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [profileId, attempt]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const previousBody = document.body.style.overflow;
    const previousHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    // A keyboard or screen-reader user who triggered this popup lands here
    // with focus still on the list card behind it otherwise — the dialog
    // opens, but nothing on screen shows where focus actually is.
    closeButtonRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousBody;
      document.documentElement.style.overflow = previousHtml;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="parent-profile-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <Card variant="clay" className="my-8 w-full max-w-[36rem] !p-0 overflow-hidden">
        {profile === undefined && timedOut ? (
          <div className="p-8 text-center">
            <p className="text-sm text-ink-3">This is taking longer than it should.</p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setAttempt((n) => n + 1)}
                className="btn btn-primary btn-sm"
              >
                Try again
              </button>
              <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">
                Close
              </button>
            </div>
          </div>
        ) : profile === undefined ? (
          <div className="flex items-center gap-2 p-8 text-sm font-semibold text-ink-3">
            <IconRefresh size={16} className="animate-spin text-accent" /> Loading profile…
          </div>
        ) : profile === null ? (
          <div className="p-8 text-center">
            <p className="text-sm text-ink-3">Couldn&rsquo;t load this parent&rsquo;s profile.</p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setAttempt((n) => n + 1)}
                className="btn btn-primary btn-sm"
              >
                Try again
              </button>
              <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">
                Close
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* ── header ── */}
            <div className="flex items-start justify-between gap-4 border-b border-line-soft p-6">
              <div className="flex items-center gap-4">
                <Avatar name={profile.fullName || profile.email || "?"} size={52} />
                <div>
                  <h2 id="parent-profile-title" className="!text-lg font-bold text-ink">
                    {profile.fullName || "Unnamed Parent"}
                  </h2>
                  <p className="mt-0.5 text-xs text-ink-3">
                    Joined{" "}
                    {new Date(profile.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="grid size-9 shrink-0 place-items-center rounded-full text-ink-3 hover:bg-surface-2 hover:text-ink"
              >
                <IconClose size={18} />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-6">
              {/* ── contact ── */}
              <div className="space-y-2.5">
                <ContactRow icon={<IconMail size={15} />} value={profile.email} placeholder="No email on file" />
                <ContactRow icon={<IconPhone size={15} />} value={profile.phone} placeholder="No phone on file" />
                {profile.leadStatus && (
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-ink-3">Lead status</span>
                    <Badge tone={STATUS_TONE[profile.leadStatus]} size="sm">
                      {STATUS_LABEL[profile.leadStatus]}
                    </Badge>
                  </div>
                )}
              </div>

              {/* ── quick stats ── */}
              <div className="mt-5 grid grid-cols-3 gap-2.5">
                <QuickStat icon={<IconUsers size={16} />} value={profile.children.length} label="Children" />
                <QuickStat icon={<IconClock size={16} />} value={profile.totalAssessments} label="Assessments" />
                <QuickStat icon={<IconTrophy size={16} />} value={profile.completedAssessments} label="Completed" />
              </div>

              {/* ── children ── */}
              <div className="mt-6">
                <p className="text-xs font-bold uppercase tracking-wider text-ink-3">Children</p>
                {profile.children.length === 0 ? (
                  <p className="mt-3 text-sm text-ink-3">No children added yet.</p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {profile.children.map((c) => {
                      const latest = c.assessments[0];
                      return (
                        <div key={c.id} className="rounded-xl border border-line-soft bg-surface-2 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-3">
                              <Avatar name={c.name} size={34} />
                              <div>
                                <p className="text-sm font-bold text-ink">{c.name}</p>
                                <p className="text-xs text-ink-3">{c.ageLabel} · {c.stageLabel}</p>
                              </div>
                            </div>
                            {!latest ? (
                              <Badge tone="neutral" size="sm">No checks yet</Badge>
                            ) : latest.completedAt ? (
                              <Badge tone="success" size="sm" icon={<IconCheck size={12} />}>
                                Completed
                              </Badge>
                            ) : (
                              <Badge tone="warn" size="sm">In progress</Badge>
                            )}
                          </div>

                          {c.assessments.length > 0 && (
                            <div className="mt-3 space-y-1.5">
                              {c.assessments.map((a) => (
                                <div
                                  key={a.id}
                                  className="flex items-center justify-between rounded-lg bg-surface px-3 py-1.5 text-xs"
                                >
                                  <span className="flex items-center gap-1.5 font-semibold text-ink-2">
                                    <IconCalendar size={12} /> {a.assessedOn}
                                  </span>
                                  {a.completedAt ? (
                                    <Link
                                      href={`/admin/report/${a.id}`}
                                      className="font-semibold text-accent hover:underline"
                                    >
                                      View report →
                                    </Link>
                                  ) : (
                                    <span className="font-semibold text-ink-3">In progress</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {profile.leadId && (
              <div className="border-t border-line-soft bg-surface-2 px-6 py-3.5">
                <Link
                  href={`/admin/leads/${profile.leadId}`}
                  className="flex items-center justify-center gap-1.5 text-sm font-semibold text-accent hover:underline"
                >
                  View full lead &amp; call log <IconArrowRight size={14} />
                </Link>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}

function ContactRow({
  icon,
  value,
  placeholder,
}: {
  icon: ReactNode;
  value: string;
  placeholder: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-surface-2 px-3 py-2">
      <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-ink">
        <span className="shrink-0 text-ink-3">{icon}</span>
        <span className="truncate">{value || placeholder}</span>
      </span>
      {value && <CopyButton value={value} label={`Copy ${value}`} />}
    </div>
  );
}

function QuickStat({ icon, value, label }: { icon: ReactNode; value: number; label: string }) {
  return (
    <div className="rounded-xl border border-line-soft bg-surface-2 p-3 text-center">
      <span className="mx-auto flex size-8 items-center justify-center rounded-lg bg-surface text-accent">
        {icon}
      </span>
      <p className="tnum mt-2 text-lg font-extrabold leading-none text-ink">{value}</p>
      <p className="mt-1 text-2xs font-semibold text-ink-3">{label}</p>
    </div>
  );
}
