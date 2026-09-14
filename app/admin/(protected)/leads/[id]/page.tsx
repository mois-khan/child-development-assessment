"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  adminGetLead,
  adminUpdateLead,
  adminLogInteraction,
  adminSetLeadStatus,
  type Lead,
  type LeadStatus,
  type InteractionOutcome,
  type InteractionChannel,
} from "@/lib/admin/leads";
import { useAdminSession } from "@/lib/admin/auth";
import { todayISO } from "@/lib/age";
import {
  Avatar,
  Badge,
  BRAND_GRADIENT,
  Button,
  ButtonLink,
  Card,
  ConfirmDeleteButton,
  IconArrowLeft,
  IconCalendar,
  IconCheck,
  IconEdit,
  IconPhone,
  IconMessage,
  IconPlus,
  IconWhatsApp,
  IconMail,
  IconUser,
  IconDots,
  IconShield,
  IconRefresh,
} from "@/components/ui";
import type { CSSProperties, ReactNode } from "react";

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
  whatsapp: <IconWhatsApp size={16} />,
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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

/* ── Page ────────────────────────────────────────────────────────────────── */

export default function AdminLeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { session } = useAdminSession();
  const [lead, setLead] = useState<Lead | null | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<"children" | "log">("children");
  const [showLogForm, setShowLogForm] = useState(false);

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

  return (
    <div className="space-y-6 pb-12">
      <BackLink />

      <HeroCard lead={lead} session={session} onSaved={refresh} isClosed={isClosed} />

      {/* ── Tabs ── */}
      <div className="grid grid-cols-2 gap-2 sm:inline-flex sm:w-auto">
        {(["children", "log"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`w-full rounded-full px-5 py-2 text-sm font-bold transition-all sm:w-auto ${
              activeTab === tab
                ? "bg-[var(--accent)] text-white shadow-md scale-100"
                : "bg-surface-2 text-ink-3 hover:bg-surface-3 hover:text-ink scale-95 origin-left"
            }`}
          >
            {tab === "children" ? "Children" : `Log History (${lead.interactions.length})`}
          </button>
        ))}
      </div>

      {/* ── Tab: Children ── */}
      {activeTab === "children" && (
        <Card className="!p-6">
          <h2 className="!text-base font-bold text-ink">Children & Assessments</h2>
          {lead.children.length === 0 ? (
            <p className="mt-4 text-sm text-ink-3">No children registered under this account yet.</p>
          ) : (
            <div className="mt-4 space-y-4">
              {lead.children.map((c) => {
                return (
                  <div key={c.id} className="rounded-xl border border-line-soft bg-surface-2 p-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={c.name} size={36} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold text-ink">{c.name}</p>
                          <Badge size="sm">{c.stageLabel}</Badge>
                        </div>
                        <p className="text-xs text-ink-3">
                          {c.ageLabel} · Born {c.dob}
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
                            className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface px-3 py-2 text-sm"
                          >
                            <div>
                              <span className="font-semibold text-ink">{a.assessedOn}</span>
                            </div>
                            {a.completedAt ? (
                              <div className="flex items-center gap-2">
                                <Badge tone="success" size="sm">Completed</Badge>
                                <ButtonLink href={`/admin/report/${a.id}`} size="sm" variant="secondary">
                                  View Report
                                </ButtonLink>
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
      )}

      {/* ── Tab: Log History ── */}
      {activeTab === "log" && (
        <div className="space-y-4">
          {/* Mobile: a button above history opens the log form as a panel,
              instead of the form sitting below every past interaction where
              it's off the first screen. Desktop keeps it as a static sidebar. */}
          {!isClosed ? (
            <div className="lg:hidden">
              <button
                type="button"
                onClick={() => setShowLogForm((s) => !s)}
                className="btn btn-primary w-full justify-center"
              >
                <IconPlus size={16} className={showLogForm ? "rotate-45 transition-transform" : "transition-transform"} />
                {showLogForm ? "Close form" : "Log New Interaction"}
              </button>
              {showLogForm && (
                <div className="mt-4">
                  <LogInteractionForm
                    leadId={lead.id}
                    loggedByUserId={session?.id ?? ""}
                    onLogged={() => { refresh(); setShowLogForm(false); }}
                  />
                </div>
              )}
            </div>
          ) : (
            <Card className="!p-5 text-center lg:hidden">
              <p className="text-sm font-semibold text-ink-3">
                This lead is marked as <strong>{STATUS_LABEL[lead.status]}</strong>.
              </p>
              <p className="mt-1 text-xs text-ink-3">
                Reopen it above to log more interactions.
              </p>
            </Card>
          )}

          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            {/* History timeline */}
            <Card className="!p-6">
              <h2 className="!text-base font-bold text-ink">Contact History</h2>
              {lead.interactions.length === 0 ? (
                <div className="mt-6 rounded-xl border-2 border-dashed border-line-soft p-8 text-center">
                  <p className="text-sm text-ink-3">No interactions logged yet.</p>
                  <p className="mt-1 text-xs text-ink-3">
                    Use the form to record your first contact.
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

            {/* Log form — always visible as a sidebar on desktop; the mobile
                collapsible panel above covers small screens */}
            <div className="hidden lg:block">
              {!isClosed ? (
                <LogInteractionForm
                  leadId={lead.id}
                  loggedByUserId={session?.id ?? ""}
                  onLogged={refresh}
                />
              ) : (
                <Card className="!p-5 text-center">
                  <p className="text-sm font-semibold text-ink-3">
                    This lead is marked as <strong>{STATUS_LABEL[lead.status]}</strong>.
                  </p>
                  <p className="mt-1 text-xs text-ink-3">
                    Reopen it above to log more interactions.
                  </p>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Hero card: identity + status + inline profile edit, all in one ──────── */

function HeroCard({
  lead,
  session,
  onSaved,
  isClosed,
}: {
  lead: Lead;
  session: { id: string } | null | undefined;
  onSaved: () => void;
  isClosed: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(lead.parentName ?? "");
  const [phone, setPhone] = useState(lead.phone ?? "");
  const [email, setEmail] = useState(lead.email ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = todayISO();
  const isOverdue = lead.nextFollowUpAt && lead.nextFollowUpAt < today && !isClosed;
  const isDueToday = lead.nextFollowUpAt?.startsWith(today) && !isClosed;

  function startEditing() {
    setName(lead.parentName ?? "");
    setPhone(lead.phone ?? "");
    setEmail(lead.email ?? "");
    setError(null);
    setEditing(true);
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await adminUpdateLead(lead.id, {
        parentName: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
      });
      setEditing(false);
      onSaved();
    } catch (err: any) {
      setError(err?.message || "Failed to save. You may not have permission to edit parents.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-4 shadow-sm sm:p-6"
      style={{ background: BRAND_GRADIENT }}
    >
      <div
        aria-hidden="true"
        className="bloom"
        style={{ width: 200, height: 200, top: -90, right: "10%", "--bloom-color": "var(--sun-300)", opacity: 0.2 } as CSSProperties}
      />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <Avatar
            name={lead.parentName || "?"}
            size={60}
            className="shrink-0"
            style={{ background: "rgba(255,255,255,0.18)", color: "#fff" }}
          />
          <div className="min-w-0 flex-1">
            {editing ? (
              <div className="max-w-sm space-y-2.5">
                <input
                  className="field"
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <input
                    type="tel"
                    className="field"
                    placeholder="Phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  <input
                    type="email"
                    className="field"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                {error && <p className="text-xs font-semibold text-white">{error}</p>}
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={save} disabled={saving} iconLeft={<IconCheck size={14} />}>
                    {saving ? "Saving…" : "Save"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="!text-white/85 hover:!bg-white/15 hover:!text-white"
                    onClick={() => setEditing(false)}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-1.5">
                  <h1 className="!text-xl font-bold text-white sm:!text-2xl">{lead.parentName || "Unnamed Parent"}</h1>
                  <button
                    type="button"
                    onClick={startEditing}
                    aria-label="Edit parent details"
                    title="Edit parent details"
                    className="grid size-7 shrink-0 place-items-center rounded-full text-white/60 transition-colors hover:bg-white/15 hover:text-white"
                  >
                    <IconEdit size={14} />
                  </button>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm font-semibold">
                  {lead.phone && (
                    <a
                      href={`tel:${lead.phone}`}
                      className="flex items-center gap-1.5 break-all text-white/90 underline decoration-white/40 underline-offset-2 transition-colors hover:text-white hover:decoration-white"
                    >
                      <IconPhone size={14} className="shrink-0" /> {lead.phone}
                    </a>
                  )}
                  {lead.email && (
                    <a
                      href={`mailto:${lead.email}`}
                      className="flex items-center gap-1.5 break-all text-white/90 underline decoration-white/40 underline-offset-2 transition-colors hover:text-white hover:decoration-white"
                    >
                      <IconMail size={14} className="shrink-0" /> {lead.email}
                    </a>
                  )}
                </div>
                <p className="mt-1.5 text-xs text-white/70">
                  Created {formatDate(lead.createdAt)}
                  {lead.source && ` · via ${lead.source}`}
                </p>
              </>
            )}
          </div>
        </div>

        {!editing && (
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <Badge tone={STATUS_TONE[lead.status]} size="lg">
              {STATUS_LABEL[lead.status]}
            </Badge>
            <LeadStatusAction
              lead={lead}
              loggedByUserId={session?.id ?? ""}
              onChanged={onSaved}
              className="!text-white/85 hover:!bg-white/15 hover:!text-white"
            />
          </div>
        )}
      </div>

      {!editing && (lead.lastInteractionAt || lead.nextFollowUpAt) && (
        <div className="relative mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/15 pt-3.5 text-xs font-semibold text-white/75">
          {lead.lastInteractionAt && <span>Last contacted {formatDate(lead.lastInteractionAt)}</span>}
          {lead.nextFollowUpAt && (isOverdue || isDueToday) && (
            <span
              className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold"
              style={
                isOverdue
                  ? { background: "var(--st-consult-soft)", color: "var(--st-consult-ink)" }
                  : { background: "var(--st-emerging-soft)", color: "var(--st-emerging-ink)" }
              }
            >
              {isOverdue ? <IconShield size={12} className="shrink-0" /> : <IconCalendar size={12} className="shrink-0" />}
              {isOverdue ? "Overdue" : "Due today"} · {formatDate(lead.nextFollowUpAt)}
            </span>
          )}
          {lead.nextFollowUpAt && !isOverdue && !isDueToday && (
            <span>Next follow-up {formatDate(lead.nextFollowUpAt)}</span>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Status override (Lost / Reopen) ────────────────────────────────────── */

function LeadStatusAction({
  lead,
  loggedByUserId,
  onChanged,
  className,
}: {
  lead: Lead;
  loggedByUserId: string;
  onChanged: () => void;
  className?: string;
}) {
  const [saving, setSaving] = useState(false);
  const isClosed = ["converted", "lost", "not_interested"].includes(lead.status);

  async function setStatus(status: LeadStatus) {
    setSaving(true);
    try {
      await adminSetLeadStatus(lead.id, status, loggedByUserId);
      onChanged();
    } finally {
      setSaving(false);
    }
  }

  if (isClosed) {
    return (
      <ConfirmDeleteButton
        onConfirm={() => setStatus("new")}
        label={saving ? "Reopening…" : "Reopen lead"}
        confirmLabel="Click again to reopen"
        className={className}
      />
    );
  }

  return (
    <ConfirmDeleteButton
      onConfirm={() => setStatus("lost")}
      label={saving ? "Saving…" : "Mark as lost"}
      confirmLabel="Click again to confirm"
      className={className}
    />
  );
}

/* ── Interaction log form ─────────────────────────────────────────────────── */

function LogInteractionForm({
  leadId,
  loggedByUserId,
  onLogged,
}: {
  leadId: string;
  loggedByUserId: string;
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
    <Card className="!p-5">
      <h2 className="!text-base font-bold text-ink">Log New Interaction</h2>
      <p className="mt-0.5 text-xs text-ink-3">
        Everything is optional except the outcome.
      </p>

      <div className="mt-3.5 space-y-3">
        {/* Channel — icon-only, one row, so it never needs to wrap */}
        <div>
          <label className="label mb-1.5">Channel</label>
          <div className="flex flex-wrap gap-1.5">
            {(Object.entries(CHANNEL_LABEL) as [InteractionChannel, string][]).map(([v, l]) => (
              <button
                key={v}
                type="button"
                title={l}
                aria-label={l}
                aria-pressed={channel === v}
                onClick={() => setChannel(v)}
                className={`grid size-9 shrink-0 place-items-center rounded-full transition-all ${
                  channel === v
                    ? "bg-[var(--accent)] text-white shadow-md"
                    : "bg-surface-2 text-ink-3 hover:bg-surface-3 hover:text-ink"
                }`}
              >
                {CHANNEL_ICON[v]}
              </button>
            ))}
          </div>
        </div>

        {/* Outcome + follow-up date, side by side once there's room for both */}
        <div className="flex flex-col gap-3 sm:grid sm:grid-cols-[1fr_auto]">
          <div>
            <label className="label mb-1.5">Outcome</label>
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
          <div className="flex flex-col justify-end">
            {scheduleFollowUp ? (
              <input
                type="date"
                className="field w-full sm:!w-auto"
                value={nextDate}
                min={todayISO()}
                onChange={(e) => setNextDate(e.target.value)}
              />
            ) : (
              <button
                type="button"
                onClick={toggleFollowUp}
                className="btn btn-secondary btn-sm w-full justify-center whitespace-nowrap sm:w-auto"
              >
                <IconCalendar size={14} /> Follow-up
              </button>
            )}
          </div>
        </div>
        {scheduleFollowUp && (
          <button
            type="button"
            onClick={toggleFollowUp}
            className="-mt-2 text-xs font-semibold text-ink-3 hover:text-ink"
          >
            Cancel follow-up date
          </button>
        )}

        {/* Notes */}
        <div>
          <label className="label mb-1.5">Notes <span className="font-normal text-ink-3">(optional)</span></label>
          <textarea
            className="field w-full"
            rows={2}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="What was discussed?"
          />
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
