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
 * to do. `?next=` carries where they were heading so a parent bounced off a
 * page mid-task returns to it; everyone else lands on their dashboard.
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
  const { user, loading, signUp, signIn, signInWithGoogle, resetPassword } = useAuth();

  const rawNext = params.get("next");
  // No `next` means they came here on their own rather than being bounced off
  // a page they wanted. /dashboard is a parent's home — it is what the top-bar
  // link, the middleware's own signed-in redirect and this page must all agree
  // on, or "sign in" lands somewhere different depending on how you got here.
  const next = !rawNext || rawNext === "/" || rawNext === "/join" ? "/dashboard" : rawNext;
  const [mode, setMode] = useState<"signup" | "signin" | "forgot">(
    params.get("mode") === "signin" ? "signin" : "signup",
  );

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [error, setError] = useState<string | null>(
    params.get("error") === "oauth" ? "Something went wrong signing in with Google. Please try again." : null,
  );

  async function continueWithGoogle() {
    setError(null);
    setGoogleBusy(true);
    const result = await signInWithGoogle(next);
    if (result.error) {
      setError(result.error);
      setGoogleBusy(false);
    }
    // On success the browser is already navigating to Google — nothing left to do here.
  }

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
      : mode === "forgot"
        ? emailOk
        : emailOk && password.length > 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!canSubmit || submitting) return;

    setSubmitting(true);
    setError(null);

    if (mode === "forgot") {
      const result = await resetPassword(email.trim());
      setSubmitting(false);
      if (result.error) {
        setError(result.error);
        return;
      }
      setResetSent(true);
      return;
    }

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

  if (resetSent) {
    return (
      <>
        <TopBar nav={false} />
        <Shell width="narrow">
          <div className="pt-20 text-center">
            <Mascot size={96} mood="wave" className="mx-auto" />
            <h1 className="mt-6">Check your email</h1>
            <p className="prose-read mx-auto mt-3 max-w-[42ch]">
              If there&rsquo;s an account for{" "}
              <strong className="font-bold text-ink">{email.trim()}</strong>, we&rsquo;ve sent
              a link to reset the password, valid for a short while.
            </p>
            <Button
              className="mt-8"
              onClick={() => {
                setMode("signin");
                setResetSent(false);
              }}
            >
              Back to sign in
            </Button>
          </div>
        </Shell>
      </>
    );
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
              <strong className="font-bold text-ink">{email.trim()}</strong>. Open it, and
              you can start the check.
            </p>
            <Button className="mt-8" onClick={() => setMode("signin")}>
              I&rsquo;ve confirmed, sign me in
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
                {mode === "signup"
                  ? "Create your account"
                  : mode === "forgot"
                    ? "Reset your password"
                    : "Welcome back"}
              </p>
              <h1 className="mt-3">
                {mode === "signup"
                  ? "Let's get started"
                  : mode === "forgot"
                    ? "Forgot your password?"
                    : "Sign in to continue"}
              </h1>
            </div>

            <Card variant="clay" className="mt-9 p-6 sm:p-8">
              {mode !== "forgot" && (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    block
                    disabled={googleBusy}
                    iconLeft={<GoogleGlyph size={18} />}
                    onClick={continueWithGoogle}
                  >
                    {googleBusy ? "Redirecting…" : "Continue with Google"}
                  </Button>
                  <div className="my-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-ink-2">
                    <span className="h-px flex-1 bg-line" />
                    or
                    <span className="h-px flex-1 bg-line" />
                  </div>
                </>
              )}

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

                {mode !== "forgot" && (
                  <div>
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
                    {mode === "signin" && (
                      <button
                        type="button"
                        className="mt-2 text-sm font-semibold text-accent hover:underline"
                        onClick={() => {
                          setMode("forgot");
                          setError(null);
                          setTouched(false);
                        }}
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                )}

                {error && (
                  <div
                    role="alert"
                    className="rounded-[var(--radius-sm)] px-4 py-3 text-sm font-semibold"
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
                      : mode === "forgot"
                        ? "Sending…"
                        : "Signing you in…"
                    : mode === "signup"
                      ? "Create account"
                      : mode === "forgot"
                        ? "Send reset link"
                        : "Sign in"}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-ink-2">
                {mode === "forgot" ? (
                  <button
                    type="button"
                    className="font-bold text-accent hover:underline"
                    onClick={() => {
                      setMode("signin");
                      setError(null);
                      setTouched(false);
                    }}
                  >
                    Back to sign in
                  </button>
                ) : (
                  <>
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
                  </>
                )}
              </p>
            </Card>

            <div className="mt-6 flex items-start gap-3 rounded-[var(--radius)] border border-line bg-[var(--surface)] p-4">
              <span className="mt-0.5 text-accent">
                <IconShield size={20} />
              </span>
              <p className="text-sm leading-relaxed text-ink-2">
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

/** Google's "G" mark. Brand guidelines require its four colours as-is, so
 *  unlike the rest of this app's icons it doesn't take currentColor. */
function GoogleGlyph({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.54 5.54 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.11A11.998 11.998 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.28A7.2 7.2 0 0 1 4.9 12c0-.79.14-1.56.37-2.28V6.61H1.27A12 12 0 0 0 0 12c0 1.94.46 3.77 1.27 5.39l4-3.11Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.34.61 4.58 1.79l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.27 6.61l4 3.11C6.22 6.87 8.87 4.77 12 4.77Z"
      />
    </svg>
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
