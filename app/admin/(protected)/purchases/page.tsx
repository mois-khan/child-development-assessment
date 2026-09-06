"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Badge, Card } from "@/components/ui";

interface PaymentRow {
  id: string;
  profile_id: string;
  assessment_id: string | null;
  amount_paise: number;
  currency: string;
  status: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  created_at: string;
  profiles: { full_name: string; email: string; phone: string } | null;
}

const STATUS_TONE: Record<string, "success" | "warn" | "danger" | "neutral"> = {
  paid: "success",
  pending: "warn",
  failed: "danger",
};

function formatRupees(paise: number): string {
  return "₹" + (paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

export default function AdminPurchasesPage() {
  const [payments, setPayments] = useState<PaymentRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase
      .from("payments")
      .select("*, profiles:profile_id(full_name, email, phone)")
      .order("created_at", { ascending: false })
      .then(({ data, error: err }) => {
        if (err) setError(err.message);
        else setPayments((data as any) ?? []);
      });
  }, []);

  const totalRevenue =
    payments?.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.amount_paise, 0) ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="!text-2xl">Course Purchases</h1>
          <p className="mt-1 text-sm text-ink-3">
            {payments === null
              ? "Loading…"
              : `${payments.length} transaction${payments.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        {payments !== null && totalRevenue > 0 && (
          <Card className="!p-4 !py-3 border-[var(--st-on-track)]" style={{ background: "var(--st-on-track-soft)" }}>
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--st-on-track-ink)]">
              Total Revenue
            </p>
            <p className="text-3xl font-extrabold leading-none text-[var(--st-on-track-ink)]">
              {formatRupees(totalRevenue)}
            </p>
          </Card>
        )}
      </div>

      {error && (
        <Card className="!p-4 border-[var(--st-consult)]">
          <p className="text-sm text-[var(--st-consult-ink)]">⚠ {error}</p>
        </Card>
      )}

      {payments === null && !error && (
        <p className="text-sm text-ink-3">Loading…</p>
      )}

      {payments !== null && payments.length === 0 && (
        <Card className="!p-8 text-center">
          <p className="text-sm text-ink-3">No purchases yet.</p>
        </Card>
      )}

      <div className="space-y-3">
        {payments?.map((p) => {
          const profile = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
          return (
            <Card key={p.id} className="!p-5">
              <div className="flex flex-wrap items-center gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-ink">{profile?.full_name || "—"}</p>
                  <p className="mt-0.5 text-xs text-ink-3">
                    {profile?.email || "No email"} · {profile?.phone || "No phone"}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-3">
                    {new Date(p.created_at).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                    {p.razorpay_payment_id && (
                      <span className="ml-2 font-mono text-2xs text-ink-3">
                        {p.razorpay_payment_id}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-xl font-extrabold text-ink tnum">
                    {formatRupees(p.amount_paise)}
                  </p>
                  <Badge tone={STATUS_TONE[p.status] ?? "neutral"}>
                    {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                  </Badge>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
