"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminDashboardCounts, type AdminDashboardCounts } from "@/lib/admin/data";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { Badge, Card, IconClock, IconShield, IconTrophy, IconUsers } from "@/components/ui";
import type { ReactNode } from "react";

export default function AdminDashboardPage() {
  const [counts, setCounts] = useState<AdminDashboardCounts | null>(null);

  useEffect(() => {
    adminDashboardCounts().then(setCounts);
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="!text-[1.6rem]">Dashboard</h1>
          {!isSupabaseConfigured() && (
            <Badge tone="warn">Dev mode — reading this browser's local data only</Badge>
          )}
        </div>
        <p className="mt-1.5 text-[0.9rem] text-ink-3">
          An overview of submissions across the programme.
        </p>
      </div>

      {!counts ? (
        <p className="text-[0.9rem] text-ink-3">Loading…</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatTile value={counts.totalChildren} label="Children" icon={<IconUsers size={20} />} color="var(--accent)" />
          <StatTile
            value={counts.totalAssessments}
            label="Assessments"
            icon={<IconTrophy size={20} />}
            color="var(--sec-manual)"
          />
          <StatTile
            value={counts.inProgressAssessments}
            label="In progress"
            icon={<IconClock size={20} />}
            color="var(--st-emerging)"
          />
          <StatTile
            value={counts.needsFollowUp}
            label="Worth a closer look"
            icon={<IconShield size={20} />}
            color="var(--st-consult)"
          />
        </div>
      )}

      <Card className="!p-6">
        <h2 className="!text-[1.05rem]">Get started</h2>
        <p className="mt-2 max-w-[52ch] text-[0.88rem] leading-relaxed text-ink-3">
          Every submission made through the parent-facing check shows up in{" "}
          <Link href="/admin/submissions" className="font-semibold text-accent">
            Submissions
          </Link>
          . Try it: open the check in another tab, answer a few questions, and it will appear
          here immediately — no setup needed.
        </p>
      </Card>
    </div>
  );
}

/** A dashboard metric with the same tinted-glow icon language as the rest of
 *  the product (SectionTile), rather than a bare number in a shared card —
 *  each metric gets its own colour identity and depth. */
function StatTile({
  value,
  label,
  icon,
  color,
}: {
  value: ReactNode;
  label: string;
  icon: ReactNode;
  color: string;
}) {
  return (
    <Card variant="tint" tint={color} className="lift !p-5">
      <span
        className="grid size-11 place-items-center rounded-2xl"
        style={{
          color,
          background: `color-mix(in srgb, ${color} 14%, var(--surface))`,
          boxShadow: `0 1px 2px rgba(69, 77, 93, 0.08), 0 8px 18px -8px color-mix(in srgb, ${color} 60%, transparent)`,
        }}
      >
        {icon}
      </span>
      <p className="tnum mt-3.5 text-[1.65rem] font-extrabold leading-none text-ink">{value}</p>
      <p className="mt-1.5 text-[0.82rem] font-semibold text-ink-3">{label}</p>
    </Card>
  );
}
