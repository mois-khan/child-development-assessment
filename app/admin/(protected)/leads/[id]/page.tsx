"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { todayISO } from "@/lib/age";
import {
  Avatar,
  Badge,
  Button,
  Card,
  IconArrowLeft,
  IconCalendar,
  IconCheck,
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

const OUTCOME_LABEL: Record<InteractionOutcome, string> = {
  interested: "Interested",
  not_interested: "Not Interested",
  call_back: "Call Back",
  info_requested: "Info Requested",
  payment_discussion: "Payment Discussion",
  assessment_discussion: "Assessment Discussion",
  converted: "Converted",
  no_response: "No Response",
  other: "Other"
};

const CHANNEL_LABEL: Record<InteractionChannel, string> = {
  phone: "Phone",
  whatsapp: "WhatsApp",
  email: "Email",
  sms: "SMS",
  in_person: "In Person",
  other: "Other"
};

export default function AdminLeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { session } = useAdminSession();
  const [lead, setLead] = useState<Lead | null | undefined>(undefined);
  const [editingDetails, setEditingDetails] = useState(false);

  const refresh = () => { adminGetLead(id).then(setLead); };
  useEffect(refresh, [id]);

  if (lead === undefined) return <p className="text-[0.9rem] text-ink-3">Loading…</p>;
  if (lead === null) {
    return (
      <div className="space-y-4">
        <BackLink />
        <Card className="!p-8 text-center">
          <p className="text-[0.92rem] text-ink-3">No lead found with that id.</p>
        </Card>
      </div>
    );
  }

  const closed = lead.status === "converted" || lead.status === "lost" || lead.status === "not_interested";

  return (
    <div className="space-y-6">
      <BackLink />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar name={lead.parentName || "Unknown"} size={64} />
          <div>
            <h1 className="!text-[1.6rem]">{lead.parentName || "Unnamed Parent"}</h1>
            <p className="text-[0.9rem] text-ink-3 mt-1">
              {lead.phone || "No phone"} · {lead.email || "No email"}
            </p>
            <p className="text-[0.8rem] text-ink-3 mt-1">
              Lead created: {new Date(lead.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-3">
          <Badge tone={STATUS_TONE[lead.status]} size="lg">
            {STATUS_LABEL[lead.status]}
          </Badge>
          {lead.nextFollowUpAt && !closed && (
            <Card variant="tint" tint="var(--st-emerging)" className="!p-3 !py-2 text-right">
              <p className="text-[0.7rem] uppercase font-bold text-ink-3 tracking-wider">Next Follow-Up</p>
              <p className="text-[1.1rem] font-bold text-ink flex items-center gap-2">
                <IconCalendar size={16} /> {new Date(lead.nextFollowUpAt).toLocaleDateString()}
              </p>
            </Card>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <Card className="!p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="!text-[1.1rem]">Parent Details</h2>
              <Button size="sm" variant="ghost" onClick={() => setEditingDetails((s) => !s)}>
                {editingDetails ? "Cancel" : "Edit"}
              </Button>
            </div>

            {editingDetails ? (
              <LeadDetailsForm
                lead={lead}
                onSaved={() => {
                  refresh();
                  setEditingDetails(false);
                }}
              />
            ) : (
              <dl className="mt-5 grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-2">
                <Field label="Name" value={lead.parentName || "—"} />
                <Field label="Phone" value={lead.phone || "—"} />
                <Field label="Email" value={lead.email || "—"} />
                <Field label="Source" value={lead.source} />
                <Field label="Assigned to" value={lead.assignedToEmail || "Unassigned"} />
              </dl>
            )}
          </Card>

          <Card className="!p-6">
            <h2 className="!text-[1.1rem]">Children & Assessments</h2>
            {lead.children.length === 0 ? (
              <p className="mt-4 text-[0.88rem] text-ink-3">No children recorded.</p>
            ) : (
              <div className="mt-5 space-y-5">
                {lead.children.map(c => (
                  <div key={c.id} className="border-l-2 border-line-soft pl-4">
                    <p className="font-bold text-ink">{c.name}</p>
                    <p className="text-[0.8rem] text-ink-3">Born {c.dob}</p>
                    {c.assessments.length > 0 ? (
                      <div className="mt-2 space-y-2">
                        {c.assessments.map(a => (
                          <div key={a.id} className="flex items-center justify-between bg-surface-2 p-2 rounded text-[0.85rem]">
                            <span>{a.assessedOn}</span>
                            {a.completedAt ? (
                              <Link href={`/report/${a.id}`} className="text-accent font-semibold hover:underline">View Report</Link>
                            ) : (
                              <span className="text-ink-3 italic">In progress</span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-[0.85rem] text-ink-3">No assessments started.</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          {!closed && (
            <Card className="!p-6">
              <h2 className="!text-[1.1rem]">Log Interaction</h2>
              <LogInteractionForm
                leadId={lead.id}
                loggedByUserId={session?.id ?? ""}
                onLogged={refresh}
              />
            </Card>
          )}

          <Card className="!p-6">
            <h2 className="!text-[1.1rem]">Interaction History</h2>
            {lead.interactions.length === 0 ? (
              <p className="mt-4 text-[0.88rem] text-ink-3">No interactions logged yet.</p>
            ) : (
              <ul className="mt-5 list-none space-y-5 p-0">
                {lead.interactions.map((f) => (
                  <li key={f.id} className="flex gap-3 border-l-2 border-line-soft pl-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="neutral" size="sm">
                          {OUTCOME_LABEL[f.outcome]}
                        </Badge>
                        <span className="text-[0.78rem] font-semibold text-ink-3">
                          {new Date(f.occurredAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                        <span className="text-[0.75rem] text-ink-3 bg-surface-2 px-1.5 py-0.5 rounded">
                          {CHANNEL_LABEL[f.channel]}
                        </span>
                      </div>
                      {f.remarks && <p className="mt-2 text-[0.88rem] text-ink-2 whitespace-pre-wrap">{f.remarks}</p>}
                      <p className="mt-2 text-[0.74rem] text-ink-3">
                        Logged by {f.loggedByEmail || "unknown"}
                        {f.nextFollowUpAt && ` · set next follow-up ${new Date(f.nextFollowUpAt).toLocaleDateString()}`}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-ink-3">{label}</dt>
      <dd className="mt-0.5 truncate text-[0.9rem] font-medium text-ink">{value}</dd>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/admin/leads"
      className="inline-flex items-center gap-1.5 text-[0.85rem] font-semibold text-ink-3 hover:text-ink"
    >
      <IconArrowLeft size={16} /> All leads
    </Link>
  );
}

function LeadDetailsForm({ lead, onSaved }: { lead: Lead; onSaved: () => void }) {
  const [parentName, setParentName] = useState(lead.parentName ?? "");
  const [phone, setPhone] = useState(lead.phone ?? "");
  const [email, setEmail] = useState(lead.email ?? "");

  async function save() {
    await adminUpdateLead(lead.id, {
      parentName: parentName.trim(),
      phone: phone.trim(),
      email: email.trim(),
    });
    onSaved();
  }

  return (
    <div className="mt-5 grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="label">Parent&rsquo;s Name</label>
        <input className="field" value={parentName} onChange={(e) => setParentName(e.target.value)} autoFocus />
      </div>
      <div>
        <label className="label">Phone</label>
        <input type="tel" className="field" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <div>
        <label className="label">Email</label>
        <input type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="sm:col-span-2 flex justify-end mt-2">
        <Button size="sm" onClick={save} iconLeft={<IconCheck size={14} />}>
          Save details
        </Button>
      </div>
    </div>
  );
}

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

  const needsNextDate = !["converted", "not_interested", "lost"].includes(outcome);
  const canSave = !needsNextDate || nextDate !== "";

  async function save() {
    if (!canSave) return;
    await adminLogInteraction(leadId, {
      channel,
      outcome,
      remarks: remarks.trim(),
      loggedByUserId,
      nextFollowUpAt: needsNextDate ? nextDate : undefined,
    });
    setRemarks("");
    setNextDate("");
    setOutcome("interested");
    onLogged();
  }

  return (
    <div className="mt-5 grid gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Channel</label>
          <select className="field w-full" value={channel} onChange={(e) => setChannel(e.target.value as InteractionChannel)}>
            {Object.entries(CHANNEL_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Outcome</label>
          <select className="field w-full" value={outcome} onChange={(e) => setOutcome(e.target.value as InteractionOutcome)}>
            {Object.entries(OUTCOME_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>
      
      <div>
        <label className="label">Remarks</label>
        <textarea className="field w-full" rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Summary of the conversation..." />
      </div>
      
      {needsNextDate && (
        <div>
          <label className="label">Next Follow-Up</label>
          <input
            type="date"
            className="field"
            value={nextDate}
            min={todayISO()}
            onChange={(e) => setNextDate(e.target.value)}
          />
        </div>
      )}
      
      <div className="flex justify-end mt-2">
        <Button size="sm" onClick={save} disabled={!canSave} iconLeft={<IconCalendar size={14} />}>
          Log interaction
        </Button>
      </div>
    </div>
  );
}
