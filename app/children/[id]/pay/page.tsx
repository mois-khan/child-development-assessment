"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DOMAINS } from "@/content/domains";
import { itemBankReady, liveScoredItemsFor, primeItemBank } from "@/lib/item-bank";
import { stageForAge } from "@/lib/stage";
import { formatAge, summariseAge, todayISO } from "@/lib/age";
import { createAssessment, getChild, type SavedChild } from "@/lib/store";
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  ChildCard,
  Confetti,
  Footer,
  IconArrowRight,
  IconCheck,
  IconClock,
  IconShield,
  IconSparkle,
  LoadError,
  Mascot,
  Section,
  SectionTile,
  Shell,
  TopBar,
  domainColor,
} from "@/components/ui";

const PRICE = 99;

/**
 * Start the check — one screen, one decision.
 *
 * This used to be two pages: a "choose a check" screen that showed the one
 * real option next to two greyed-out "coming soon" cards and made a parent
 * click "Continue" to confirm the only choice available, then a separate
 * "unlock" screen for the coupon. Picking among one option isn't a choice, so
 * that click was pure friction — merged here into a single screen: what the
 * check covers, then the one thing that actually needs a decision (the
 * coupon), then go.
 */
export default function PayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [child, setChild] = useState<SavedChild | null | undefined | "error">(undefined);
  const [coupon, setCoupon] = useState("");
  const [applied, setApplied] = useState(false);
  const [showCoupon, setShowCoupon] = useState(false);
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [celebrating, setCelebrating] = useState(false);
  const [bankReady, setBankReady] = useState(itemBankReady());
  const [bankFailed, setBankFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setChild(undefined);
    getChild(id)
      .then(c => {
        if (active) setChild(c);
      })
      .catch(() => {
        if (active) setChild("error");
      });
    return () => { active = false; };
  }, [id, loadAttempt]);

  useEffect(() => {
    let active = true;
    setBankFailed(false);
    primeItemBank()
      .then(() => {
        if (active) setBankReady(true);
      })
      .catch(() => {
        if (active) setBankFailed(true);
      });
    return () => { active = false; };
  }, [loadAttempt]);

  const today = todayISO();
  const age = useMemo(
    () => (child && child !== "error" ? summariseAge(child.dob, today, child.gestationalWeeks) : null),
    [child, today],
  );
  const startStage = age ? stageForAge(age.assessedMonths) : null;

  /* The assessment adapts as it goes, so the real length is not knowable up
     front — a child who passes everything climbs, one who does not descends.
     What we can show honestly is where it starts, and that most checks land
     within a stage or two of that. */
  const perSection = useMemo(() => {
    if (!startStage || !age) return [];
    if (!bankReady) return [];
    return DOMAINS.map((d) => ({
      code: d.code,
      name: d.name,
      count: liveScoredItemsFor(startStage.id, d.code, age.assessedMonths).length,
    }));
  }, [startStage, age, bankReady]);
  const questionCount = perSection.reduce((n, s) => n + s.count, 0);

  async function applyCoupon(e: React.FormEvent) {
    e.preventDefault();
    if (!child || child === "error") return;
    setError("");
    setStarting(true);
    try {
      const res = await fetch("/api/payments/coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childId: child.id, code: coupon }),
      });
      if (res.ok) {
        setApplied(true);
      } else {
        const body = await res.json().catch(() => ({}));
        setError(body?.error === "Invalid coupon code"
          ? "That code doesn't look right; check and try again."
          : "Couldn't apply that code. Please try again.");
      }
    } catch {
      setError("Couldn't apply that code. Please try again.");
    } finally {
      setStarting(false);
    }
  }

  /* The payment (or coupon) just landed — worth a beat of "that worked" before
     dropping the parent straight into ten minutes of questions. The record is
     created up front so the celebration and the navigation it leads to never
     race each other.

     Payment/coupon has already succeeded by the time either caller reaches
     this — a failure here means money moved (or a coupon got burned) with
     nothing to show for it, so this can't fail silently or leave the button
     stuck on "Preparing…" forever. */
  async function celebrateThenGo() {
    if (!child || child === "error" || !age || !startStage) return;
    try {
      const stagesByDomain = Object.fromEntries(
        DOMAINS.map((d) => [d.code, [startStage.id]]),
      ) as Record<(typeof DOMAINS)[number]["code"], string[]>;
      const record = await createAssessment(child, today, stagesByDomain);
      setCelebrating(true);
      window.setTimeout(() => router.push(`/assessment/${record.id}`), 1700);
    } catch (err) {
      console.error(err);
      setError(
        "That went through, but we couldn't start the check. Please contact support — don't pay again.",
      );
      setStarting(false);
    }
  }

  async function startAssessment() {
    if (!child || child === "error" || !age || !startStage) return;
    setStarting(true);
    setError("");

    if (applied) {
      // Coupon already redeemed server-side in applyCoupon() — the payments
      // row that unlocks assessment creation already exists.
      await celebrateThenGo();
      return;
    }

    try {
      const orderRes = await fetch("/api/payments/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childId: child.id }),
      });
      if (!orderRes.ok) throw new Error("Failed to create order");
      const order = await orderRes.json();

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Kaushalya Genius",
        description: "Genius Milestone Check",
        order_id: order.id,
        handler: async function (response: any) {
          // The payment already succeeded on Razorpay's side by the time this
          // fires — a network drop here must not leave the parent staring at
          // a stuck "Preparing…" button with a charge they can't account for.
          try {
            const verifyRes = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            if (verifyRes.ok) {
              await celebrateThenGo();
            } else {
              setError("Payment verification failed. Please contact support.");
              setStarting(false);
            }
          } catch (err) {
            console.error(err);
            setError(
              "Payment went through, but we couldn't confirm it here. Please contact support — don't pay again.",
            );
            setStarting(false);
          }
        },
        prefill: {
          name: child.name,
        },
        theme: {
          color: "#E24A7F", // brand accent
        },
        modal: {
          // Closing the checkout without paying fires neither `handler` nor
          // `payment.failed` — without this, the button stays stuck on
          // "Preparing…" until a full page reload.
          ondismiss: () => setStarting(false),
        },
      };

      if (typeof (window as any).Razorpay !== "function") {
        setError("Payment is still loading — give it a moment and try again.");
        setStarting(false);
        return;
      }
      const rzp1 = new (window as any).Razorpay(options);
      rzp1.on("payment.failed", function (response: any) {
        setError(response.error.description || "Payment failed");
        setStarting(false);
      });
      rzp1.open();
    } catch (err) {
      console.error(err);
      setError("Failed to initiate payment. Please try again.");
      setStarting(false);
    }
  }

  if (child === undefined || !bankReady) {
    return (
      <>
        <TopBar />
        <Shell>
          <p className="pt-24 text-center font-semibold text-ink-3">Loading…</p>
        </Shell>
      </>
    );
  }
  if (child === "error" || bankFailed) {
    return (
      <>
        <TopBar />
        <Shell width="narrow">
          <LoadError onRetry={() => setLoadAttempt((n) => n + 1)} />
        </Shell>
      </>
    );
  }
  if (child === null || !age || !startStage) {
    return (
      <>
        <TopBar />
        <Shell width="narrow">
          <div className="pt-20 text-center">
            <Mascot size={90} mood="think" className="mx-auto" />
            <h1 className="mt-6">We couldn&rsquo;t find that child</h1>
            <ButtonLink href="/children" className="mt-8">
              Go to your children
            </ButtonLink>
          </div>
        </Shell>
      </>
    );
  }
  if (celebrating) {
    return <PaymentCelebration childName={child.name} />;
  }

  return (
    <>
      <TopBar />

      <main>
        <Section size="sm">
          <Shell width="reading">
            <div className="flex flex-wrap items-end justify-between gap-5">
              <div>
                <p className="eyebrow eyebrow-accent">Genius Milestone Check</p>
                <h1 className="mt-3">Start {child.name}&rsquo;s check</h1>
                <p className="lede mt-3 max-w-[46ch]">
                  Built for {child.name}&rsquo;s exact phase: Phase {startStage.roman},{" "}
                  {startStage.name}.
                </p>
              </div>
              <ChildCard
                name={child.name}
                photoUrl={child.photoUrl}
                ageLabel={`${formatAge(age.chronologicalMonths)} old`}
              />
            </div>

            <Card variant="clay" className="clay-lg mt-8 overflow-hidden">
              <div className="p-6 sm:p-7">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge tone="accent" size="lg">
                      <IconSparkle size={14} /> Phase {startStage.roman} · {startStage.name}
                    </Badge>
                    <Badge tone="neutral">from {questionCount} questions</Badge>
                    <Badge tone="neutral">
                      <IconClock size={14} /> ~10 min
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p
                      className="tnum text-3xl font-extrabold leading-none text-ink"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {applied ? "₹0" : `₹${PRICE}`}
                    </p>
                    {applied && (
                      <p className="tnum mt-1 text-sm font-bold text-ink-3 line-through">
                        ₹{PRICE}
                      </p>
                    )}
                  </div>
                </div>

                {applied && (
                  <div className="animate-rise mt-5 flex items-center gap-4 rounded-[var(--radius)] bg-[var(--st-on-track-soft)] p-4">
                    <span className="animate-pop grid size-11 shrink-0 place-items-center rounded-full bg-[var(--surface)] text-[var(--st-on-track)]">
                      <IconCheck size={22} />
                    </span>
                    <div>
                      <p className="text-sm font-extrabold text-[var(--st-on-track-ink)]">
                        Code applied, this one&rsquo;s on us
                      </p>
                      <p className="text-xs font-semibold text-ink-3">
                        Coupon {coupon.trim().toUpperCase()} · launch offer
                      </p>
                    </div>
                  </div>
                )}

                {/* the payment decision, answered immediately — no scrolling
                    needed to find the one button that matters */}
                <div className="mt-6 flex flex-wrap items-center gap-4">
                  <Button
                    size="lg"
                    disabled={starting}
                    onClick={startAssessment}
                    iconRight={<IconArrowRight size={18} />}
                  >
                    {starting ? "Preparing…" : applied ? "Start the check" : `Pay ₹${PRICE} & Start`}
                  </Button>
                  {!applied && (
                    <button
                      type="button"
                      onClick={() => setShowCoupon((v) => !v)}
                      className="text-sm font-bold text-accent hover:underline"
                    >
                      Have a coupon code?
                    </button>
                  )}
                </div>

                {!applied && showCoupon && (
                  <form onSubmit={applyCoupon} className="animate-rise mt-4 flex flex-wrap items-start gap-3">
                    <div className="min-w-[13rem] flex-1">
                      <input
                        className={`field ${error ? "field-error" : ""}`}
                        placeholder="Enter coupon code"
                        value={coupon}
                        onChange={(e) => {
                          setCoupon(e.target.value);
                          setError("");
                        }}
                        autoComplete="off"
                        aria-label="Coupon code"
                        autoFocus
                      />
                      {error && <p className="hint hint-error">{error}</p>}
                    </div>
                    <Button type="submit" variant="secondary" size="lg" disabled={starting}>
                      {starting ? "Checking…" : "Apply"}
                    </Button>
                  </form>
                )}
              </div>

              {/* what's inside — the "which check" question, answered rather
                  than asked, since there is only ever one real option today */}
              <div className="border-t border-line-soft bg-[var(--surface-2)] p-6 sm:p-7">
                <p className="eyebrow mb-4">Six short sections, one question at a time</p>
                <ul className="grid list-none gap-3 p-0 sm:grid-cols-2">
                  {perSection.map((s) => (
                    <li key={s.code} className="flex items-center gap-3">
                      <SectionTile code={s.code} size={38} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-ink">
                          {s.name}
                        </span>
                        <span
                          className="block text-xs font-semibold"
                          style={{ color: domainColor(s.code) }}
                        >
                          {s.count} question{s.count === 1 ? "" : "s"}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>

            <div className="mt-8 flex items-start gap-3 rounded-[var(--radius)] border border-line bg-[var(--surface)] p-4">
              <span className="mt-0.5 text-accent">
                <IconShield size={20} />
              </span>
              <p className="text-sm leading-relaxed text-ink-2">
                Payments are handled by Razorpay; we never see or store your card details.{" "}
                {child.name}&rsquo;s answers are saved securely to your account so you can pick
                up the check on any device.
              </p>
            </div>
          </Shell>
        </Section>
      </main>

      <Footer />
    </>
  );
}

/* ══ celebration ═══════════════════════════════════════════════════════════ */

function PaymentCelebration({ childName }: { childName: string }) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-hidden px-6 text-center"
      style={{ background: "var(--ground)" }}
      role="status"
      aria-live="polite"
    >
      <Confetti count={44} />
      <div>
        <span
          className="celebrate-ring mx-auto grid size-32 place-items-center rounded-full"
          style={{ background: "var(--st-on-track-soft)", color: "var(--st-on-track)" }}
        >
          <IconCheck size={64} />
        </span>
        <h1 className="animate-rise mt-8" style={{ animationDelay: "160ms" }}>
          You&rsquo;re in!
        </h1>
        <p className="lede animate-rise mt-3" style={{ animationDelay: "240ms" }}>
          Let&rsquo;s find {childName}&rsquo;s stage.
        </p>
      </div>
    </div>
  );
}
