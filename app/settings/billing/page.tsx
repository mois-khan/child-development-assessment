"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Badge, Card, LoadError } from "@/components/ui";

/* ── what this page owns ─────────────────────────────────────────────────────
 * What you paid for and when. Not what you're enrolled in doing next — that
 * marketing content lives outside settings entirely.
 * ────────────────────────────────────────────────────────────────────────── */

interface PaymentRecord {
  id: string;
  amountPaise: number;
  status: string;
  razorpayPaymentId: string | null;
  createdAt: string;
  paidAt: string | null;
}

export default function BillingSettingsPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<PaymentRecord[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!user) return;
    let active = true;
    setFailed(false);

    getSupabaseBrowserClient()
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setFailed(true);
          return;
        }
        setPayments(
          (data || []).map((p: any) => ({
            id: p.id,
            amountPaise: p.amount_paise,
            status: p.status,
            razorpayPaymentId: p.razorpay_payment_id,
            createdAt: p.created_at,
            paidAt: p.paid_at,
          })),
        );
      });

    return () => {
      active = false;
    };
  }, [user, attempt]);

  const paid = payments?.filter((p) => p.status === "paid") ?? [];

  return (
    <div className="space-y-5">
      <h2>Billing</h2>

      {failed ? (
        <LoadError onRetry={() => setAttempt((n) => n + 1)} />
      ) : payments === null ? (
        <p className="font-semibold text-ink-3">Loading payment history…</p>
      ) : paid.length === 0 ? (
        <Card variant="clay" className="p-8 text-center">
          <p className="font-medium text-ink-2">No payments yet.</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {paid.map((p) => (
            <Card key={p.id} variant="clay" className="p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-base font-extrabold text-ink">Genius Milestone Assessment Access</span>
                <Badge tone="success">Paid</Badge>
              </div>
              <p className="mt-1.5 text-sm text-ink-3">
                {formatRupees(p.amountPaise)} on {formatDateTime(p.paidAt || p.createdAt)}
              </p>
              {p.razorpayPaymentId && (
                <p className="mt-0.5 font-mono text-xs text-ink-3">Ref: {p.razorpayPaymentId}</p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function formatRupees(paise: number): string {
  return "₹" + (paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

function formatDateTime(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
