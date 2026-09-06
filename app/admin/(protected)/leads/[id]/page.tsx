"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FOLLOW_UP_VERDICTS,
  LEAD_STAGES,
  adminDeleteLead,
  adminGetLead,
  adminLogFollowUp,
  adminUpdateLead,
  type FollowUpVerdict,
  type Lead,
  type LeadStage,
} from "@/lib/admin/leads";
import { useAdminSession } from "@/lib/admin/auth";
import { todayISO } from "@/lib/age";
import {
  Avatar,
  Badge,
  Button,
  Card,
  ConfirmDeleteButton,
  IconArrowLeft,
  IconCalendar,
  IconCheck,
} from "@/components/ui";

const STAGE_TONE: Record<LeadStage, "neutral" | "accent" | "success" | "danger"> = {
  new: "accent",
  contacted: "neutral",
  won: "success",
  lost: "danger",
};

const VERDICT_TONE: Record<FollowUpVerdict, "success" | "danger" | "warn" | "neutral"> = {
  interested: "success",
  no_answer: "warn",
  converted: "success",
  not_interested: "danger",
  do_not_contact: "danger",
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

  const closed = lead.stage === "won" || lead.stage === "lost";
  const timeline = [...lead.followUps].reverse();

  return (
    <div className="space-y-6">
      <BackLink />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar name={lead.parentName ?? lead.childName} size={56} />
          <div>
            <h1 className="!text-[1.4rem]">{lead.parentName ?? `For ${lead.childName}`}</h1>
            <p className="text-[0.85rem] text-ink-3">
              {lead.parentName ? `Child: ${lead.childName}` : "Parent's name not recorded yet"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Badge tone={STAGE_TONE[lead.stage]} size="lg">
            {LEAD_STAGES.find((s) => s.value === lead.stage)?.label}
          </Badge>
          {lead.assessmentId && (
            <Link
              href={`/admin/submissions/${lead.assessmentId}`}
              className="text-[0.85rem] font-semibold text-accent hover:underline"
            >
              View assessment
            </Link>
          )}
        </div>
      </div>

      <Card className="!p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="!text-[1rem]">Contact details</h2>
          <Button size="sm" variant="ghost" onClick={() => setEditingDetails((s) => !s)}>
            {editingDetails ? "Done" : "Edit"}
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
          <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field label="Phone" value={lead.phone || "Not recorded"} />
            <Field label="City" value={lead.city || "—"} />
            <Field label="Source" value={SOURCE_LABEL[lead.source]} />
            <Field label="Assigned to" value={lead.assignedTo || "Unassigned"} />
          </dl>
        )}
      </Card>

      {!closed && (
        <Card className="!p-6">
          <h2 className="!text-[1rem]">Log a follow-up</h2>
          <p className="mt-1 text-[0.82rem] text-ink-3">
            What happened on this call, and — unless it&rsquo;s settled — when to try again.
          </p>
          <LogFollowUpForm
            leadId={lead.id}
            defaultLoggedBy={session?.email ?? ""}
            onLogged={refresh}
          />
        </Card>
      )}

      <Card className="!p-6">
        <h2 className="!text-[1rem]">Call history</h2>
        {timeline.length === 0 ? (
          <p className="mt-3 text-[0.88rem] text-ink-3">
            {lead.isSaved
              ? "No calls logged yet."
              : "Nobody has followed up on this lead yet — log the first call above."}
          </p>
        ) : (
          <ul className="mt-4 list-none space-y-4 p-0">
            {timeline.map((f) => (
              <li key={f.id} className="flex gap-3 border-l-2 border-line-soft pl-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={VERDICT_TONE[f.verdict]} size="sm">
                      {FOLLOW_UP_VERDICTS.find((v) => v.value === f.verdict)?.label}
                    </Badge>
                    <span className="text-[0.78rem] font-semibold text-ink-3">{f.date}</span>
                  </div>
                  {f.note && <p className="mt-1.5 text-[0.88rem] text-ink-2">{f.note}</p>}
                  <p className="mt-1 text-[0.74rem] text-ink-3">
                    Logged by {f.loggedBy || "unknown"}
                    {f.nextFollowUpAt && ` · next follow-up ${f.nextFollowUpAt}`}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {lead.isSaved && (
        <Card className="!p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="!text-[1rem]">Remove this lead</h2>
              <p className="mt-1 text-[0.82rem] text-ink-3">
                {lead.assessmentId
                  ? "Clears the call history you've logged. The assessment itself is untouched, and this lead reappears as untouched next time you look."
                  : "This lead has no assessment behind it — deleting it removes it for good."}
              </p>
            </div>
            <ConfirmDeleteButton
              onConfirm={() => {
                adminDeleteLead(lead.id);
                router.push("/admin/leads");
              }}
            />
          </div>
        </Card>
      )}
    </div>
  );
}

const SOURCE_LABEL: Record<Lead["source"], string> = {
  assessment: "From an assessment",
  referral: "Referral",
  website: "Website inquiry",
  walk_in: "Walk-in",
  other: "Other",
};

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-ink-3">{label}</dt>
      <dd className="mt-0.5 truncate text-[0.88rem] font-semibold text-ink">{value}</dd>
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
  const [city, setCity] = useState(lead.city ?? "");
  const [assignedTo, setAssignedTo] = useState(lead.assignedTo ?? "");

  async function save() {
    await adminUpdateLead(lead.id, {
      childName: lead.childName,
      parentName: parentName.trim() || undefined,
      phone: phone.trim() || undefined,
      city: city.trim() || undefined,
      assignedTo: assignedTo.trim() || undefined,
      source: lead.source,
    });
    onSaved();
  }

  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <div>
        <label className="label">Parent&rsquo;s name</label>
        <input className="field" value={parentName} onChange={(e) => setParentName(e.target.value)} autoFocus />
      </div>
      <div>
        <label className="label">Phone</label>
        <input type="tel" className="field" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <div>
        <label className="label">City</label>
        <input className="field" value={city} onChange={(e) => setCity(e.target.value)} />
      </div>
      <div>
        <label className="label">Assigned to</label>
        <input
          className="field"
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
          placeholder="rep@kaushalyageniuskid.com"
        />
      </div>
      <div className="sm:col-span-2 flex justify-end">
        <Button size="sm" onClick={save} iconLeft={<IconCheck size={14} />}>
          Save details
        </Button>
      </div>
    </div>
  );
}

function LogFollowUpForm({
  leadId,
  defaultLoggedBy,
  onLogged,
}: {
  leadId: string;
  defaultLoggedBy: string;
  onLogged: () => void;
}) {
  const [date, setDate] = useState(todayISO());
  const [verdict, setVerdict] = useState<FollowUpVerdict>("interested");
  const [note, setNote] = useState("");
  const [nextDate, setNextDate] = useState("");

  const meta = FOLLOW_UP_VERDICTS.find((v) => v.value === verdict)!;
  const needsNextDate = !meta.closes;
  const canSave = date !== "" && (!needsNextDate || nextDate !== "");

  async function save() {
    if (!canSave) return;
    await adminLogFollowUp(leadId, {
      date,
      verdict,
      note: note.trim(),
      loggedBy: defaultLoggedBy,
      nextFollowUpAt: needsNextDate ? nextDate : undefined,
    });
    setNote("");
    setNextDate("");
    onLogged();
  }

  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <div>
        <label className="label">Call date</label>
        <input type="date" className="field" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div>
        <label className="label">Verdict</label>
        <select
          className="field !w-auto"
          value={verdict}
          onChange={(e) => setVerdict(e.target.value as FollowUpVerdict)}
        >
          {FOLLOW_UP_VERDICTS.map((v) => (
            <option key={v.value} value={v.value}>
              {v.label}
            </option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className="label">
          Note <span className="font-normal text-ink-3">(optional)</span>
        </label>
        <textarea className="field" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      {needsNextDate && (
        <div>
          <label className="label">Next follow-up date</label>
          <input
            type="date"
            className="field"
            value={nextDate}
            min={todayISO()}
            onChange={(e) => setNextDate(e.target.value)}
          />
          {!nextDate && <p className="hint">Needed so this lead shows back up on the worklist.</p>}
        </div>
      )}
      <div className={`flex items-end ${needsNextDate ? "" : "sm:col-span-2"} justify-end`}>
        <Button size="sm" onClick={save} disabled={!canSave} iconLeft={<IconCalendar size={14} />}>
          Log follow-up
        </Button>
      </div>
    </div>
  );
}
