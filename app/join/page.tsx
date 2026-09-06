"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/provider";
import {
  Button,
  Card,
  Footer,
  IconArrowRight,
  IconCheck,
  IconShield,
  Mascot,
  Section,
  Shell,
  TopBar,
} from "@/components/ui";

/**
 * One page, two modes. Creating an account and signing in are the same
 * decision from the parent's side — "let me in" — and splitting them across
 * two routes just adds a navigation between someone and the thing they came
 * to do. `?next=` carries where they were heading so they land there and not
 * on a generic dashboard.
 */
export default function JoinPage() {
  return (
    <Suspense fallback={null}>
      <JoinInner />
    </Suspense>
  );
}

function JoinInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, loading, signUp, signIn } = useAuth();

  const rawNext = params.get("next");
  const next = !rawNext || rawNext === "/" || rawNext === "/join" ? "/profile" : rawNext;
  const [mode, setMode] = useState<"signup" | "signin">(
    params.get("mode") === "signin" ? "signin" : "signup",
  );

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);

  // Already signed in? Don't make them look at a login form.
  useEffect(() => {
    if (!loading && user) router.replace(next);
  }, [loading, user, next, router]);

  const nameOk = fullName.trim().length > 1;
  const phoneOk = /^[0-9+\-\s()]{8,15}$/.test(phone.trim());
  const emailOk = /^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(email.trim());
  const passwordOk = password.length >= 6;

  const canSubmit =
    mode === "signup"
      ? nameOk && phoneOk && emailOk && passwordOk
      : emailOk && password.length > 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!canSubmit || submitting) return;

    setSubmitting(true);
    setError(null);

    const result =
      mode === "signup"
        ? await signUp({
            fullName: fullName.trim(),
            phone: phone.trim(),
            email: email.trim(),
            password,
          })
        : await signIn(email.trim(), password);

    if (result.error) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    if (mode === "signup") {
      // With email confirmation switched on in Supabase, signUp succeeds but
      // hands back no session. Try to sign in; if that's refused, the account
      // exists and is simply waiting on the confirmation link.
      const signInResult = await signIn(email.trim(), password);
      if (signInResult.error) {
        setCheckEmail(true);
        setSubmitting(false);
        return;
      }
    }

    router.replace(next);
  }

  if (checkEmail) {
    return (
      <>
        <TopBar nav={false} />
        <Shell width="narrow">
          <div className="pt-20 text-center">
            <Mascot size={96} mood="wave" className="mx-auto" />
            <h1 className="mt-6">Check your email</h1>
            <p className="prose-read mx-auto mt-3 max-w-[42ch]">
              Your account is created. We&rsquo;ve sent a confirmation link to{" "}
              <strong className="font-bold text-ink">{email.trim()}</strong> — open it, and
              you can start the check.
            </p>
            <Button className="mt-8" onClick={() => setMode("signin")}>
              I&rsquo;ve confirmed — sign me in
            </Button>
          </div>
        </Shell>
      </>
    );
  }

  return (
    <>
      <TopBar />

      <main>
        <Section size="sm">
          <Shell width="narrow">
            <div className="text-center">
              <p className="eyebrow eyebrow-accent justify-center">
                {mode === "signup" ? "Create your account" : "Welcome back"}
              </p>
              <h1 className="mt-3">
                {mode === "signup" ? "Let's get started" : "Sign in to continue"}
              </h1>
              <p className="lede mx-auto mt-3 max-w-[40ch]">
                {mode === "signup"
                  ? "Three details, and your child's results are saved to your account for good."
                  : "Your children and their reports are waiting."}
              </p>
            </div>

            <Card variant="clay" className="mt-9 p-6 sm:p-8">
              <form onSubmit={submit} noValidate className="space-y-5">
                {mode === "signup" && (
                  <>
                    <Field
                      id="fullName"
                      label="Your name"
                      value={fullName}
                      onChange={setFullName}
                      placeholder="Priya Sharma"
                      autoComplete="name"
                      valid={nameOk}
                      showError={touched && !nameOk}
                      error="Please tell us your name."
                    />
                    <Field
                      id="phone"
                      label="Mobile number"
                      type="tel"
                      value={phone}
                      onChange={setPhone}
                      placeholder="98765 43210"
                      autoComplete="tel"
                      valid={phoneOk}
                      showError={touched && !phoneOk}
                      error="Please enter a valid mobile number."
                      hint="We'll use this to reach you about your child's results."
                    />
                  </>
                )}

                <Field
                  id="email"
                  label="Email address"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="priya@example.com"
                  autoComplete="email"
                  valid={emailOk}
                  showError={touched && !emailOk}
                  error="Please enter a valid email address."
                />

                <Field
                  id="password"
                  label="Password"
                  type="password"
                  value={password}
                  onChange={setPassword}
                  placeholder={mode === "signup" ? "At least 6 characters" : ""}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  valid={mode === "signup" ? passwordOk : password.length > 0}
                  showError={touched && mode === "signup" && !passwordOk}
                  error="Passwords need at least 6 characters."
                />

                {error && (
                  <div
                    role="alert"
                    className="rounded-[var(--radius-sm)] px-4 py-3 text-[0.88rem] font-semibold"
                    style={{
                      background: "var(--st-consult-soft)",
                      color: "var(--st-consult)",
                    }}
                  >
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  size="lg"
                  block
                  disabled={submitting}
                  iconRight={!submitting ? <IconArrowRight size={18} /> : undefined}
                >
                  {submitting
                    ? mode === "signup"
                      ? "Creating your account…"
                      : "Signing you in…"
                    : mode === "signup"
                      ? "Create account"
                      : "Sign in"}
                </Button>
              </form>

              <p className="mt-6 text-center text-[0.9rem] text-ink-2">
                {mode === "signup" ? "Already have an account?" : "New here?"}{" "}
                <button
                  type="button"
                  className="font-bold text-accent hover:underline"
                  onClick={() => {
                    setMode(mode === "signup" ? "signin" : "signup");
                    setError(null);
                    setTouched(false);
                  }}
                >
                  {mode === "signup" ? "Sign in" : "Create one"}
                </button>
              </p>
            </Card>

            <div className="mt-6 flex items-start gap-3 rounded-[var(--radius)] border border-line bg-[var(--surface)] p-4">
              <span className="mt-0.5 text-accent">
                <IconShield size={20} />
              </span>
              <p className="text-[0.85rem] leading-relaxed text-ink-2">
                Your details are used to save your child&rsquo;s results and to contact you
                about them. We never sell them or share them with anyone else.
              </p>
            </div>
          </Shell>
        </Section>
      </main>

      <Footer />
    </>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  autoComplete,
  valid,
  showError,
  error,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  autoComplete?: string;
  valid: boolean;
  showError: boolean;
  error: string;
  hint?: string;
}) {
  return (
    <div>
      <label className="label" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={type}
          className={`field ${showError ? "field-error" : valid ? "field-valid pr-11" : ""}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
        />
        {valid && !showError && (
          <span
            className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2"
            style={{ color: "var(--st-on-track)" }}
          >
            <IconCheck size={19} />
          </span>
        )}
      </div>
      {showError ? (
        <p className="hint hint-error">{error}</p>
      ) : hint ? (
        <p className="hint">{hint}</p>
      ) : null}
    </div>
  );
}
