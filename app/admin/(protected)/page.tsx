"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminDashboardCounts, type AdminDashboardCounts } from "@/lib/admin/data";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { Badge, Card, IconClock, IconShield, IconTrophy, IconUsers, Stat } from "@/components/ui";

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
        <Card variant="clay" className="grid grid-cols-2 gap-6 !p-7 sm:grid-cols-4">
          <Stat value={counts.totalChildren} label="Children" icon={<IconUsers size={20} />} />
          <Stat
            value={counts.totalAssessments}
            label="Assessments"
            icon={<IconTrophy size={20} />}
            color="var(--sec-manual)"
          />
          <Stat
            value={counts.inProgressAssessments}
            label="In progress"
            icon={<IconClock size={20} />}
            color="var(--st-emerging)"
          />
          <Stat
            value={counts.needsFollowUp}
            label="Worth a closer look"
            icon={<IconShield size={20} />}
            color="var(--st-consult)"
          />
        </Card>
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
