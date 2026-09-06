"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  useAdminLeads,
  type Lead,
  type LeadStatus,
} from "@/lib/admin/leads";
import { useAdminSession } from "@/lib/admin/auth";
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

export default function AdminLeadsPage() {
  const { session } = useAdminSession();
  const { leads, refresh } = useAdminLeads();
  const [quick, setQuick] = useState<QuickFilter>("worklist");
  const [query, setQuery] = useState("");

  const today = new Date().toISOString().slice(0, 10);

  const counts = useMemo(
    () => ({
      overdue: leads.filter((l) => l.nextFollowUpAt && l.nextFollowUpAt < today).length,
      dueToday: leads.filter((l) => l.nextFollowUpAt?.startsWith(today)).length,
      new: leads.filter((l) => l.status === "new").length,
      won: leads.filter((l) => l.status === "converted").length,
      lost: leads.filter((l) => l.status === "lost" || l.status === "not_interested").length,
    }),
    [leads, today],
  );

  const filtered = useMemo(() => {
    let rows = leads;
    if (quick === "worklist") {
      rows = rows.filter(
        (l) => l.status === "new" || l.status === "contacted" || l.status === "follow_up" || l.status === "interested",
      );
    } else if (quick === "new") {
      rows = rows.filter((l) => l.status === "new");
    } else if (quick === "won") {
      rows = rows.filter((l) => l.status === "converted");
    } else if (quick === "lost") {
      rows = rows.filter((l) => l.status === "lost" || l.status === "not_interested");
    }
    if (query) {
      const q = query.toLowerCase();
      rows = rows.filter(
        (l) =>
          l.parentName?.toLowerCase().includes(q) ||
          l.phone?.includes(q) ||
          l.email?.includes(q) ||
          l.children.some(c => c.name.toLowerCase().includes(q)),
      );
    }
    return rows;
  }, [leads, quick, query]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="!text-[1.6rem]">Leads</h1>
          </div>
          <p className="mt-1.5 max-w-[62ch] text-[0.88rem] text-ink-3">
            Every completed assessment shows up here automatically as a lead worth calling.
            Log what happens on each call — the date and the verdict decide when it needs
            following up again.
          </p>
        </div>
      </div>

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
          placeholder="Search by name, email or phone"
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
  const overdue = !!lead.nextFollowUpAt && lead.nextFollowUpAt < today && lead.status !== "converted" && lead.status !== "lost" && lead.status !== "not_interested";
  const dueToday = !!lead.nextFollowUpAt && lead.nextFollowUpAt.startsWith(today);
  const childText = lead.children.length === 1 ? `Child: ${lead.children[0].name}` : `${lead.children.length} children`;

  return (
    <Link
      href={`/admin/leads/${lead.id}`}
      className="flex flex-wrap items-center gap-4 px-5 py-4 transition-colors hover:bg-surface-2"
    >
      <Avatar name={lead.parentName || "Unknown"} size={40} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[0.94rem] font-bold text-ink">
          {lead.parentName || "Unnamed Parent"}
          <span className="ml-1.5 font-medium text-ink-3">· {childText}</span>
        </p>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[0.78rem] text-ink-3">
          {lead.phone ? (
            <span className="flex items-center gap-1">
              <IconPhone size={12} /> {lead.phone}
            </span>
          ) : (
            <span className="italic">No phone</span>
          )}
          {lead.lastInteractionAt && <span>Last interaction: {new Date(lead.lastInteractionAt).toLocaleDateString()}</span>}
        </p>
      </div>
      <div className="flex items-center gap-2.5">
        {lead.nextFollowUpAt && (lead.status === "new" || lead.status === "contacted" || lead.status === "follow_up" || lead.status === "interested") && (
          <span
            className="flex items-center gap-1.5 text-[0.8rem] font-bold"
            style={{ color: overdue ? "var(--st-consult)" : dueToday ? "var(--st-emerging)" : "var(--ink-3)" }}
          >
            <IconCalendar size={13} />
            {overdue ? "Overdue" : dueToday ? "Due today" : new Date(lead.nextFollowUpAt).toLocaleDateString()}
          </span>
        )}
        <Badge tone={STATUS_TONE[lead.status]}>{STATUS_LABEL[lead.status]}</Badge>
      </div>
    </Link>
  );
}
