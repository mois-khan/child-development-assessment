"use client";

import { useMemo, useState } from "react";
import {
  useAdminLeads,
  type Lead,
  type LeadStatus,
} from "@/lib/admin/leads";
import { useAdminSession } from "@/lib/admin/auth";
import { LogInteractionForm } from "@/components/admin/LogInteractionForm";
import {
  Avatar,
  Badge,
  Button,
  ButtonLink,
  Card,
  IconBolt,
  IconCalendar,
  IconClose,
  IconMessage,
  IconPhone,
  IconShield,
  IconTrophy,
} from "@/components/ui";
import type { ReactNode } from "react";

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
  const { leads, loading, error, refresh } = useAdminLeads();
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
      <h1 className="!text-2xl">Leads</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <QuickStat label="Overdue" value={counts.overdue} icon={<IconShield size={16} />} color="var(--st-consult)" />
        <QuickStat label="Due Today" value={counts.dueToday} icon={<IconCalendar size={16} />} color="var(--st-emerging)" />
        <QuickStat label="New" value={counts.new} icon={<IconBolt size={16} />} color="var(--accent)" />
        <QuickStat label="Won" value={counts.won} icon={<IconTrophy size={16} />} color="var(--st-on-track)" />
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

      {error ? (
        <Card className="!p-8 text-center">
          <p className="text-sm font-semibold text-[var(--st-consult)]">{error}</p>
          <button type="button" onClick={refresh} className="btn btn-secondary mt-4">
            Try again
          </button>
        </Card>
      ) : loading ? (
        <Card className="!p-8 text-center">
          <p className="text-sm text-ink-3">Loading leads…</p>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="!p-8 text-center">
          <p className="text-sm text-ink-3">
            {leads.length === 0
              ? "No leads yet. They'll appear here the moment someone signs up."
              : "Nothing matches that search or filter."}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((lead) => (
            <LeadRow
              key={lead.id}
              lead={lead}
              today={today}
              loggedByUserId={session?.id ?? ""}
              onLogged={refresh}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function QuickStat({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  color: string;
}) {
  return (
    <Card className="!p-4">
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl text-white" style={{ background: color }}>
          {icon}
        </span>
        <div className="min-w-0">
          <p className="tnum text-2xl font-extrabold leading-none text-ink">{value}</p>
          <p className="mt-1 text-xs font-semibold text-ink-3">{label}</p>
        </div>
      </div>
    </Card>
  );
}

function LeadRow({
  lead,
  today,
  loggedByUserId,
  onLogged,
}: {
  lead: Lead;
  today: string;
  loggedByUserId: string;
  onLogged: () => void;
}) {
  const [logOpen, setLogOpen] = useState(false);
  const overdue = !!lead.nextFollowUpAt && lead.nextFollowUpAt < today && lead.status !== "converted" && lead.status !== "lost" && lead.status !== "not_interested";
  const dueToday = !!lead.nextFollowUpAt && lead.nextFollowUpAt.startsWith(today);
  const childText = lead.children.length === 0 ? "No children yet" : lead.children.length === 1 ? `Child: ${lead.children[0].name}` : `${lead.children.length} children`;

  return (
    <>
      <Card
        variant="clay"
        className="animate-rise flex flex-col gap-4 !p-4 transition-shadow hover:shadow-md sm:!p-5"
      >
        {/* ── basic details first ── */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <Avatar name={lead.parentName || "Unknown"} size={44} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-bold text-ink">
                {lead.parentName || "Unnamed Parent"}
                <span className="ml-1.5 font-medium text-ink-3">· {childText}</span>
              </p>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-ink-3">
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
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {lead.nextFollowUpAt && (lead.status === "new" || lead.status === "contacted" || lead.status === "follow_up" || lead.status === "interested") && (
              overdue || dueToday ? (
                <span
                  className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold"
                  style={
                    overdue
                      ? { background: "var(--st-consult-soft)", color: "var(--st-consult-ink)" }
                      : { background: "var(--st-emerging-soft)", color: "var(--st-emerging-ink)" }
                  }
                >
                  <IconCalendar size={12} className="shrink-0" />
                  {overdue ? "Overdue" : "Due today"}
                </span>
              ) : (
                <span className="text-xs font-medium text-ink-3">
                  Follow-up {new Date(lead.nextFollowUpAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </span>
              )
            )}
            <Badge tone={STATUS_TONE[lead.status]}>{STATUS_LABEL[lead.status]}</Badge>
          </div>
        </div>

        {/* ── two actions, so working a lead never has to start with a
            navigation just to log a two-second call ── */}
        <div className="flex gap-2.5 border-t border-line-soft pt-3.5">
          <ButtonLink href={`/admin/leads/${lead.id}`} variant="secondary" size="sm" block>
            Open profile
          </ButtonLink>
          <Button
            variant="secondary"
            size="sm"
            block
            iconLeft={<IconMessage size={14} />}
            onClick={() => setLogOpen(true)}
          >
            Log interaction
          </Button>
        </div>
      </Card>

      {logOpen && (
        <LogInteractionModal
          lead={lead}
          loggedByUserId={loggedByUserId}
          onClose={() => setLogOpen(false)}
          onLogged={() => {
            setLogOpen(false);
            onLogged();
          }}
        />
      )}
    </>
  );
}

/** The quick-log form, in a dialog — so it never requires leaving the list
 *  the admin is already working down. */
function LogInteractionModal({
  lead,
  loggedByUserId,
  onClose,
  onLogged,
}: {
  lead: Lead;
  loggedByUserId: string;
  onClose: () => void;
  onLogged: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="animate-rise w-full max-w-md rounded-2xl bg-[var(--surface)] p-5 shadow-2xl">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-3">Log interaction</p>
            <p className="truncate text-base font-bold text-ink">{lead.parentName || "Unnamed Parent"}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-8 shrink-0 place-items-center rounded-full text-ink-3 hover:bg-surface-2"
          >
            <IconClose size={16} />
          </button>
        </div>
        <LogInteractionForm
          leadId={lead.id}
          loggedByUserId={loggedByUserId}
          onLogged={onLogged}
          bare
        />
      </div>
    </div>
  );
}
