"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  adminGetLead,
  adminUpdateLead,
  adminLogInteraction,
  type Lead,
  type LeadStatus,
  type InteractionOutcome,
  type InteractionChannel,
} from "@/lib/admin/leads";
import { useAdminSession } from "@/lib/admin/auth";
import { completedMonths, formatAge, todayISO } from "@/lib/age";
import {
  Avatar,
  Badge,
  Button,
  Card,
  IconArrowLeft,
  IconCalendar,
  IconCheck,
  IconPhone,
  IconMessage,
  IconMail,
  IconUser,
  IconDots,
  IconShield,
  IconRefresh,
} from "@/components/ui";
import type { ReactNode } from "react";

/* ── Label maps ──────────────────────────────────────────────────────────── */

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
  new: "New Lead",
  contacted: "Contacted",
  interested: "Interested",
  follow_up: "Awaiting Follow-Up",
  converted: "Converted",
  not_interested: "Not Interested",
  lost: "Lost",
};

const OUTCOME_LABEL: Record<InteractionOutcome, string> = {
  interested: "Showed Interest",
  not_interested: "Not Interested",
  call_back: "Requested Call-Back",
  info_requested: "Requested More Info",
  payment_discussion: "Payment Discussion",
  assessment_discussion: "Assessment Discussion",
  converted: "Converted to Customer",
  no_response: "No Response",
  other: "Other",
};

const CHANNEL_ICON: Record<InteractionChannel, ReactNode> = {
  phone: <IconPhone size={16} />,
  whatsapp: <IconMessage size={16} />,
  email: <IconMail size={16} />,
  sms: <IconMessage size={16} />,
  in_person: <IconUser size={16} />,
  other: <IconDots size={16} />,
};

const CHANNEL_LABEL: Record<InteractionChannel, string> = {
  phone: "Phone Call",
  whatsapp: "WhatsApp",
  email: "Email",
  sms: "SMS",
  in_person: "In Person",
  other: "Other",
};

const ALL_STATUSES: LeadStatus[] = [
  "new", "contacted", "interested", "follow_up", "converted", "not_interested", "lost",
];

/* ── Page ────────────────────────────────────────────────────────────────── */

export default function AdminLeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { session } = useAdminSession();
  const [lead, setLead] = useState<Lead | null | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<"overview" | "log">("overview");

  const refresh = () => { adminGetLead(id).then(setLead); };
  useEffect(refresh, [id]);

  if (lead === undefined) {
    return (
      <div className="flex items-center gap-2 text-sm font-semibold text-ink-3">
        <IconRefresh size={16} className="animate-spin text-accent" /> Loading lead…
      </div>
    );
  }
  if (lead === null) {
    return (
      <div className="space-y-4">
        <BackLink />
        <Card className="!p-8 text-center">
          <p className="text-sm text-ink-3">No lead found with that ID.</p>
        </Card>
      </div>
    );
  }

  const isClosed = ["converted", "lost", "not_interested"].includes(lead.status);
  const today = todayISO();
  const isOverdue = lead.nextFollowUpAt && lead.nextFollowUpAt < today && !isClosed;
  const isDueToday = lead.nextFollowUpAt?.startsWith(today) && !isClosed;

  return (
    <div className="space-y-6 pb-12">
      <BackLink />

      {/* ── Hero header ── */}
      <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm transition-shadow hover:shadow-md">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar name={lead.parentName || "?"} size={60} />
            <div>
              <h1 className="!text-2xl font-bold">{lead.parentName || "Unnamed Parent"}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm font-semibold text-ink-3">
                {lead.phone && (
                  <a href={`tel:${lead.phone}`} className="flex items-center gap-1.5 hover:text-accent">
                    <IconPhone size={14} /> {lead.phone}
                  </a>
                )}
                {lead.email && (
                  <a href={`mailto:${lead.email}`} className="flex items-center gap-1.5 hover:text-accent">
                    <IconMail size={14} /> {lead.email}
                  </a>
                )}
              </div>
              <p className="mt-1 text-xs text-ink-3">
                Lead created {new Date(lead.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                {lead.source && ` · via ${lead.source}`}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge tone={STATUS_TONE[lead.status]} size="lg">
              {STATUS_LABEL[lead.status]}
            </Badge>
            {isOverdue && (
              <span className="flex items-center gap-1.5 rounded-full bg-[var(--st-consult-soft)] px-3 py-1.5 text-xs font-bold text-[var(--st-consult-ink)] shadow-sm border border-[var(--st-consult-soft)]">
                <IconShield size={14} /> Follow-up overdue · {lead.nextFollowUpAt}
              </span>
            )}
            {isDueToday && (
              <span className="flex items-center gap-1.5 rounded-full bg-[var(--st-emerging-soft)] px-3 py-1.5 text-xs font-bold text-[var(--st-emerging-ink)] shadow-sm border border-[var(--st-emerging-soft)]">
                <IconCalendar size={14} /> Follow-up scheduled today
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-2">
        {(["overview", "log"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-full px-5 py-2 text-sm font-bold transition-all ${
              activeTab === tab
                ? "bg-[var(--accent)] text-white shadow-md scale-100"
                : "bg-surface-2 text-ink-3 hover:bg-surface-3 hover:text-ink scale-95 origin-left"
            }`}
          >
            {tab === "overview" ? "Profile & Children" : `Interaction Log (${lead.interactions.length})`}
          </button>
        ))}
      </div>

      {/* ── Tab: Overview ── */}
      {activeTab === "overview" && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Parent details */}
          <ProfileCard lead={lead} onSaved={refresh} />

          {/* Children & assessments */}
          <Card className="!p-6">
            <h2 className="!text-base font-bold text-ink">Children & Assessments</h2>
            {lead.children.length === 0 ? (
              <p className="mt-4 text-sm text-ink-3">No children registered under this account yet.</p>
            ) : (
              <div className="mt-4 space-y-4">
                {lead.children.map((c) => {
                  const ageMonths = completedMonths(c.dob, today);
                  return (
                    <div key={c.id} className="rounded-xl border border-line-soft bg-surface-2 p-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={c.name} size={36} />
                        <div>
                          <p className="font-bold text-ink">{c.name}</p>
                          <p className="text-xs text-ink-3">
                            {formatAge(ageMonths)} · Born {c.dob}
                          </p>
                        </div>
                      </div>
                      {c.assessments.length > 0 ? (
                        <div className="mt-3 space-y-2">
                          <p className="text-2xs font-bold uppercase tracking-wider text-ink-3">
                            Assessments
                          </p>
                          {c.assessments.map((a) => (
                            <div
                              key={a.id}
                              className="flex items-center justify-between rounded-lg bg-surface px-3 py-2 text-sm"
                            >
                              <div>
                                <span className="font-semibold text-ink">{a.assessedOn}</span>
                              </div>
                              {a.completedAt ? (
                                <div className="flex items-center gap-2">
                                  <Badge tone="success" size="sm">Completed</Badge>
                                  <Link
                                    href={`/admin/report/${a.id}`}
                                    className="font-semibold text-accent hover:underline"
                                  >
                                    View Report →
                                  </Link>
                                </div>
                              ) : (
                                <Badge tone="warn" size="sm">In Progress</Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-3 text-sm text-ink-3 italic">No assessments started yet.</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── Tab: Interaction Log ── */}
      {activeTab === "log" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* History timeline */}
          <Card className="!p-6">
            <h2 className="!text-base font-bold text-ink">Contact History</h2>
            {lead.interactions.length === 0 ? (
              <div className="mt-6 rounded-xl border-2 border-dashed border-line-soft p-8 text-center">
                <p className="text-sm text-ink-3">No interactions logged yet.</p>
                <p className="mt-1 text-xs text-ink-3">
                  Use the form on the right to record your first contact.
                </p>
              </div>
            ) : (
              <ol className="mt-5 space-y-0">
                {lead.interactions.map((interaction, i) => (
                  <li key={interaction.id} className="relative flex gap-4">
                    {/* Timeline spine */}
                    {i < lead.interactions.length - 1 && (
                      <div className="absolute left-[17px] top-8 h-full w-px bg-line-soft" />
                    )}
                    {/* Icon bubble */}
                    <div className="relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-base">
                      {CHANNEL_ICON[interaction.channel]}
                    </div>
                    {/* Content */}
                    <div className="min-w-0 flex-1 pb-6">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-sm text-ink">
                          {OUTCOME_LABEL[interaction.outcome]}
                        </span>
                        <span className="text-xs text-ink-3">
                          via {CHANNEL_LABEL[interaction.channel]}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-ink-3">
                        {new Date(interaction.occurredAt).toLocaleString("en-IN", {
                          day: "numeric", month: "short", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                        {interaction.loggedByEmail && ` · by ${interaction.loggedByEmail}`}
                      </p>
                      {interaction.remarks && (
                        <p className="mt-2 rounded-lg bg-surface-2 p-3 text-sm text-ink-2 leading-relaxed whitespace-pre-wrap">
                          {interaction.remarks}
                        </p>
                      )}
                      {interaction.nextFollowUpAt && (
                        <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-[var(--st-emerging-ink)]">
                          <IconCalendar size={13} />
                          Next follow-up: {new Date(interaction.nextFollowUpAt).toLocaleDateString("en-IN", { day: "numeric", month: "long" })}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Card>

          {/* Log form */}
          {!isClosed ? (
            <div className="space-y-4">
              <LogInteractionForm
                leadId={lead.id}
                loggedByUserId={session?.id ?? ""}
                currentStatus={lead.status}
                onLogged={refresh}
              />
            </div>
          ) : (
            <Card className="!p-5 text-center">
              <p className="text-sm font-semibold text-ink-3">
                This lead is marked as <strong>{STATUS_LABEL[lead.status]}</strong>.
              </p>
              <p className="mt-1 text-xs text-ink-3">No further interactions can be logged.</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Profile card with inline edit ──────────────────────────────────────── */

function ProfileCard({ lead, onSaved }: { lead: Lead; onSaved: () => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(lead.parentName ?? "");
  const [phone, setPhone] = useState(lead.phone ?? "");
  const [email, setEmail] = useState(lead.email ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await adminUpdateLead(lead.id, {
      parentName: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
    });
    setSaving(false);
    setEditing(false);
    onSaved();
  }

  return (
    <Card className="!p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="!text-base font-bold text-ink">Parent Profile</h2>
        <Button size="sm" variant="ghost" onClick={() => setEditing((s) => !s)}>
          {editing ? "Cancel" : "Edit"}
        </Button>
      </div>

      {editing ? (
        <div className="mt-4 grid gap-4">
          <div>
            <label className="label">Full Name</label>
            <input className="field" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Phone</label>
              <input type="tel" className="field" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end">
            <Button size="sm" onClick={save} disabled={saving} iconLeft={<IconCheck size={14} />}>
              {saving ? "Saving…" : "Save Profile"}
            </Button>
          </div>
        </div>
      ) : (
        <dl className="mt-4 space-y-3">
          <InfoRow label="Full Name" value={lead.parentName || "—"} />
          <InfoRow label="Phone" value={lead.phone || "—"} />
          <InfoRow label="Email" value={lead.email || "—"} />
          <InfoRow label="Source" value={lead.source || "—"} />
          <InfoRow label="Assigned To" value={lead.assignedToEmail || "Unassigned"} />
          {lead.lastInteractionAt && (
            <InfoRow
              label="Last Contacted"
              value={new Date(lead.lastInteractionAt).toLocaleDateString("en-IN", {
                day: "numeric", month: "long", year: "numeric",
              })}
            />
          )}
          {lead.nextFollowUpAt && (
            <InfoRow
              label="Next Follow-Up"
              value={new Date(lead.nextFollowUpAt).toLocaleDateString("en-IN", {
                day: "numeric", month: "long", year: "numeric",
              })}
            />
          )}
        </dl>
      )}
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line-soft pb-2.5 last:border-0 last:pb-0">
      <dt className="shrink-0 text-xs font-bold uppercase tracking-wider text-ink-3">{label}</dt>
      <dd className="text-right text-sm font-medium text-ink">{value}</dd>
    </div>
  );
}

/* ── Interaction log form ─────────────────────────────────────────────────── */

function LogInteractionForm({
  leadId,
  loggedByUserId,
  currentStatus,
  onLogged,
}: {
  leadId: string;
  loggedByUserId: string;
  currentStatus: LeadStatus;
  onLogged: () => void;
}) {
  const [channel, setChannel] = useState<InteractionChannel>("phone");
  const [outcome, setOutcome] = useState<InteractionOutcome>("interested");
  const [remarks, setRemarks] = useState("");
  const [nextDate, setNextDate] = useState("");
  const [scheduleFollowUp, setScheduleFollowUp] = useState(false);
  const [saving, setSaving] = useState(false);

  // Follow-up date is ALWAYS optional — reset it if toggle is off
  function toggleFollowUp() {
    setScheduleFollowUp((s) => {
      if (s) setNextDate(""); // clear date when disabling
      return !s;
    });
  }

  async function save() {
    setSaving(true);
    try {
      await adminLogInteraction(leadId, {
        channel,
        outcome,
        remarks: remarks.trim(),
        loggedByUserId,
        nextFollowUpAt: scheduleFollowUp && nextDate ? nextDate : undefined,
      });
      setRemarks("");
      setNextDate("");
      setScheduleFollowUp(false);
      setOutcome("interested");
      onLogged();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="!p-6">
      <h2 className="!text-base font-bold text-ink">Log New Interaction</h2>
      <p className="mt-1 text-xs text-ink-3">
        Record what happened. Everything is optional except the outcome.
      </p>

      <div className="mt-5 space-y-4">
        {/* Channel */}
        <div>
          <label className="label">Channel</label>
          <div className="flex flex-wrap gap-2">
            {(Object.entries(CHANNEL_LABEL) as [InteractionChannel, string][]).map(([v, l]) => (
              <button
                key={v}
                type="button"
                onClick={() => setChannel(v)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                  channel === v
                    ? "bg-[var(--accent)] text-white shadow-md scale-100"
                    : "bg-surface-2 text-ink-3 hover:bg-surface-3 hover:text-ink scale-95"
                }`}
              >
                {CHANNEL_ICON[v]} {l}
              </button>
            ))}
          </div>
        </div>

        {/* Outcome */}
        <div>
          <label className="label">Outcome</label>
          <select
            className="field w-full"
            value={outcome}
            onChange={(e) => setOutcome(e.target.value as InteractionOutcome)}
          >
            {(Object.entries(OUTCOME_LABEL) as [InteractionOutcome, string][]).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>

        {/* Notes */}
        <div>
          <label className="label">Notes <span className="font-normal text-ink-3">(optional)</span></label>
          <textarea
            className="field w-full"
            rows={3}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="What was discussed? Any key details from the conversation…"
          />
        </div>

        {/* Follow-up toggle */}
        <div className="rounded-xl border border-line-soft bg-surface-2 p-4">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={scheduleFollowUp}
              onChange={toggleFollowUp}
              className="h-4 w-4 accent-[var(--accent)]"
            />
            <span className="text-sm font-semibold text-ink">
              Schedule a follow-up call
            </span>
          </label>
          {scheduleFollowUp && (
            <div className="mt-3">
              <label className="label">Follow-Up Date</label>
              <input
                type="date"
                className="field"
                value={nextDate}
                min={todayISO()}
                onChange={(e) => setNextDate(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Save — always visible */}
        <Button
          onClick={save}
          disabled={saving}
          block
          iconLeft={saving ? undefined : <IconCheck size={15} />}
        >
          {saving ? "Saving…" : "Save Interaction Log"}
        </Button>
      </div>
    </Card>
  );
}

/* ── Back link ───────────────────────────────────────────────────────────── */

function BackLink() {
  return (
    <Link
      href="/admin/leads"
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-3 hover:text-ink"
    >
      <IconArrowLeft size={16} /> All Leads
    </Link>
  );
}
