"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  adminCreateLead,
  useAdminLeads,
  type Lead,
  type LeadSource,
  type LeadStage,
} from "@/lib/admin/leads";
import { useAdminSession } from "@/lib/admin/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  Avatar,
  Badge,
  Button,
  Card,
  IconArrowRight,
  IconCalendar,
  IconPhone,
  IconPlus,
} from "@/components/ui";

type QuickFilter = "worklist" | "new" | "won" | "lost" | "all";

const SOURCES: [LeadSource, string][] = [
  ["assessment", "From an assessment"],
  ["referral", "Referral"],
  ["website", "Website inquiry"],
  ["walk_in", "Walk-in"],
  ["other", "Other"],
];

const STAGE_TONE: Record<LeadStage, "neutral" | "accent" | "success" | "danger"> = {
  new: "accent",
  contacted: "neutral",
  won: "success",
  lost: "danger",
};

const STAGE_LABEL: Record<LeadStage, string> = {
  new: "New",
  contacted: "In progress",
  won: "Won",
  lost: "Lost",
};

export default function AdminLeadsPage() {
  const configured = isSupabaseConfigured();
  const { session } = useAdminSession();
  const { leads, refresh } = useAdminLeads();
  const [quick, setQuick] = useState<QuickFilter>("worklist");
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  const counts = useMemo(
    () => ({
      overdue: leads.filter((l) => l.nextFollowUpAt && l.nextFollowUpAt < today).length,
      dueToday: leads.filter((l) => l.nextFollowUpAt === today).length,
      new: leads.filter((l) => l.stage === "new").length,
      won: leads.filter((l) => l.stage === "won").length,
      lost: leads.filter((l) => l.stage === "lost").length,
    }),
    [leads, today],
  );

  const filtered = useMemo(() => {
    let rows = leads;
    if (quick === "worklist") {
      rows = rows.filter(
        (l) => l.stage === "new" || l.stage === "contacted",
      );
    } else if (quick === "new") {
      rows = rows.filter((l) => l.stage === "new");
    } else if (quick === "won") {
      rows = rows.filter((l) => l.stage === "won");
    } else if (quick === "lost") {
      rows = rows.filter((l) => l.stage === "lost");
    }
    if (query) {
      const q = query.toLowerCase();
      rows = rows.filter(
        (l) =>
          l.childName.toLowerCase().includes(q) ||
          l.parentName?.toLowerCase().includes(q) ||
          l.phone?.includes(q),
      );
    }
    return rows;
  }, [leads, quick, query]);

  if (configured) {
    return (
      <div className="space-y-6">
        <h1 className="!text-[1.6rem]">Leads</h1>
        <Card className="!p-8 text-center">
          <p className="text-[0.92rem] text-ink-3">
            Supabase-backed leads aren&rsquo;t wired up yet — see lib/admin/leads.ts.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="!text-[1.6rem]">Leads</h1>
            <Badge tone="warn">Dev mode — saved to this browser only</Badge>
          </div>
          <p className="mt-1.5 max-w-[62ch] text-[0.88rem] text-ink-3">
            Every completed assessment shows up here automatically as a lead worth calling.
            Log what happens on each call — the date and the verdict decide when it needs
            following up again.
          </p>
        </div>
        <Button size="sm" iconLeft={<IconPlus size={16} />} onClick={() => setShowForm((s) => !s)}>
          Add lead
        </Button>
      </div>

      {showForm && (
        <NewLeadForm
          defaultAssignee={session?.email}
          onCancel={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false);
            refresh();
          }}
        />
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <QuickStat
          label="Overdue"
          value={counts.overdue}
          color="var(--st-consult)"
          active={false}
        />
        <QuickStat label="Due today" value={counts.dueToday} color="var(--st-emerging)" active={false} />
        <QuickStat label="New" value={counts.new} color="var(--accent)" active={false} />
        <QuickStat label="Won" value={counts.won} color="var(--st-on-track)" active={false} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          className="field !w-auto min-w-[16rem]"
          placeholder="Search by name or phone"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["worklist", "Worklist"],
              ["new", "New"],
              ["won", "Won"],
              ["lost", "Lost"],
              ["all", "All"],
            ] as [QuickFilter, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setQuick(value)}
              className="chip cursor-pointer"
              style={
                quick === value
                  ? ({ "--chip-bg": "var(--accent)", "--chip-fg": "var(--on-accent)", "--chip-bd": "transparent" } as React.CSSProperties)
                  : ({ "--chip-bg": "var(--surface-2)", "--chip-fg": "var(--ink-2)", "--chip-bd": "transparent" } as React.CSSProperties)
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="!p-8 text-center">
          <p className="text-[0.92rem] text-ink-3">
            {leads.length === 0
              ? "No leads yet. They'll appear here the moment a parent completes the milestone check."
              : "Nothing matches that search or filter."}
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden !p-0">
          <div className="divide-y divide-line">
            {filtered.map((lead) => (
              <LeadRow key={lead.id} lead={lead} today={today} />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function QuickStat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
  active: boolean;
}) {
  return (
    <Card variant="tint" tint={color} className="!p-4">
      <p className="tnum text-[1.4rem] font-extrabold leading-none text-ink">{value}</p>
      <p className="mt-1 text-[0.78rem] font-semibold text-ink-3">{label}</p>
    </Card>
  );
}

function LeadRow({ lead, today }: { lead: Lead; today: string }) {
  const overdue = !!lead.nextFollowUpAt && lead.nextFollowUpAt < today && lead.stage !== "won" && lead.stage !== "lost";
  const dueToday = lead.nextFollowUpAt === today;
  const lastFollowUp = lead.followUps[lead.followUps.length - 1];

  return (
    <Link
      href={`/admin/leads/${lead.id}`}
      className="flex flex-wrap items-center gap-4 px-5 py-4 transition-colors hover:bg-surface-2"
    >
      <Avatar name={lead.parentName ?? lead.childName} size={40} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[0.94rem] font-bold text-ink">
          {lead.parentName ?? `For ${lead.childName}`}
          {lead.parentName && (
            <span className="ml-1.5 font-medium text-ink-3">· {lead.childName}</span>
          )}
        </p>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[0.78rem] text-ink-3">
          {lead.phone ? (
            <span className="flex items-center gap-1">
              <IconPhone size={12} /> {lead.phone}
            </span>
          ) : (
            <span className="italic">No phone yet</span>
          )}
          {lastFollowUp && <span>Last call {lastFollowUp.date}</span>}
        </p>
      </div>
      <div className="flex items-center gap-2.5">
        {lead.nextFollowUpAt && (lead.stage === "new" || lead.stage === "contacted") && (
          <span
            className="flex items-center gap-1.5 text-[0.8rem] font-bold"
            style={{ color: overdue ? "var(--st-consult)" : dueToday ? "var(--st-emerging)" : "var(--ink-3)" }}
          >
            <IconCalendar size={13} />
            {overdue ? "Overdue" : dueToday ? "Due today" : lead.nextFollowUpAt}
          </span>
        )}
        <Badge tone={STAGE_TONE[lead.stage]}>{STAGE_LABEL[lead.stage]}</Badge>
        {!lead.isSaved && <Badge tone="neutral">Not yet contacted</Badge>}
      </div>
    </Link>
  );
}

function NewLeadForm({
  defaultAssignee,
  onCancel,
  onCreated,
}: {
  defaultAssignee?: string;
  onCancel: () => void;
  onCreated: () => void;
}) {
  const [childName, setChildName] = useState("");
  const [parentName, setParentName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [source, setSource] = useState<LeadSource>("referral");

  const canSave = childName.trim().length > 0 || parentName.trim().length > 0;

  function save() {
    if (!canSave) return;
    adminCreateLead({
      childName: childName.trim() || parentName.trim(),
      parentName: parentName.trim() || undefined,
      phone: phone.trim() || undefined,
      city: city.trim() || undefined,
      source,
      assignedTo: defaultAssignee,
    });
    onCreated();
  }

  return (
    <Card variant="tint" tint="var(--accent)" className="!p-5">
      <p className="eyebrow mb-3">New lead</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Child&rsquo;s name</label>
          <input className="field" value={childName} onChange={(e) => setChildName(e.target.value)} autoFocus />
        </div>
        <div>
          <label className="label">Parent&rsquo;s name (optional)</label>
          <input className="field" value={parentName} onChange={(e) => setParentName(e.target.value)} />
        </div>
        <div>
          <label className="label">Phone</label>
          <input type="tel" className="field" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div>
          <label className="label">City</label>
          <input className="field" value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Where this lead came from</label>
          <select className="field !w-auto" value={source} onChange={(e) => setSource(e.target.value as LeadSource)}>
            {SOURCES.filter(([v]) => v !== "assessment").map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" onClick={save} disabled={!canSave}>
          Save lead
        </Button>
      </div>
    </Card>
  );
}
