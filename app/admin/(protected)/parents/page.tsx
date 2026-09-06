"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Avatar, Badge, Card } from "@/components/ui";

type LeadStatus = "new" | "contacted" | "interested" | "follow_up" | "converted" | "not_interested" | "lost";

interface ParentRow {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  created_at: string;
  leads: { id: string; status: LeadStatus }[];
}

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

export default function AdminParentsPage() {
  const [parents, setParents] = useState<ParentRow[] | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase
      .from("profiles")
      .select("id, full_name, phone, email, created_at, leads(id, status)")
      .order("created_at", { ascending: false })
      .then(({ data, error: err }) => {
        if (err) setError(err.message);
        else setParents((data as any) ?? []);
      });
  }, []);

  const filtered = parents?.filter((p) => {
    const q = search.toLowerCase();
    return (
      !q ||
      p.full_name?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      p.phone?.includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="!text-[1.6rem]">Parents</h1>
          <p className="mt-1 text-[0.88rem] text-ink-3">
            {parents === null ? "Loading…" : `${parents.length} registered parent${parents.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <input
          className="field w-full max-w-xs"
          placeholder="Search name, email or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && (
        <Card className="!p-4 border-[var(--st-consult)]">
          <p className="text-[0.88rem] text-[var(--st-consult-ink)]">⚠ {error}</p>
        </Card>
      )}

      {parents === null && !error && (
        <p className="text-[0.9rem] text-ink-3">Loading…</p>
      )}

      {filtered !== undefined && filtered.length === 0 && (
        <Card className="!p-8 text-center">
          <p className="text-[0.92rem] text-ink-3">
            {search ? "No parents match your search." : "No parents have signed up yet."}
          </p>
        </Card>
      )}

      <div className="space-y-3">
        {filtered?.map((p) => {
          const lead = p.leads?.[0];
          return (
            <Card key={p.id} className="!p-5">
              <div className="flex flex-wrap items-center gap-4">
                <Avatar name={p.full_name || p.email || "?"} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-ink">{p.full_name || "—"}</p>
                  <p className="mt-0.5 text-[0.82rem] text-ink-3">
                    {p.email || "No email"} · {p.phone || "No phone"}
                  </p>
                  <p className="mt-0.5 text-[0.75rem] text-ink-3">
                    Joined {new Date(p.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {lead && (
                    <Badge tone={STATUS_TONE[lead.status]}>
                      {STATUS_LABEL[lead.status]}
                    </Badge>
                  )}
                  {lead && (
                    <Link
                      href={`/admin/leads/${lead.id}`}
                      className="text-[0.85rem] font-semibold text-accent hover:underline"
                    >
                      View Lead →
                    </Link>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
