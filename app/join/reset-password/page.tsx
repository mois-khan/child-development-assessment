"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/provider";
import { Button, Card, Footer, Mascot, Section, Shell, TopBar } from "@/components/ui";

/**
 * Where a Supabase password-reset email actually lands (see the
 * `redirectTo` on resetPassword() in lib/auth/provider.tsx). Mirrors
 * app/admin/accept-invite/page.tsx — same exchange-code-for-session dance,
 * just for a parent instead of an admin, and landing on /profile instead
 * of /admin.
 */
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordInner />
    </Suspense>
  );
}

function ResetPasswordInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { updatePassword } = useAuth();
  const [status, setStatus] = useState<"checking" | "ready" | "invalid">("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // Supabase's reset link is single-use, and this effect must not consume
  // it twice — in dev, React Strict Mode deliberately fires effects twice on
  // mount, and the second call would reuse an already-spent code and fail.
  // Skipping the second call outright isn't enough on its own: it would race
  // ahead to getSession() before the first (real) call has finished, and see
  // no session yet. Sharing one promise between both invocations means the
  // second one just waits for the same in-flight call instead of racing it
  // or repeating it.
  const verifyRef = useRef<Promise<{ error: { message: string } | null }> | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const { getSupabaseBrowserClient } = await import("@/lib/supabase/client");
      const supabase = getSupabaseBrowserClient();

      // Confirmed against a real generated invite link (accept-invite uses
      // the identical landing pattern): Supabase's email links land here
      // with the tokens in the URL HASH — #access_token=...&refresh_token=
      // ...&type=recovery — an implicit-grant callback, not a `code` or
      // `token_hash` query param. That matters because @supabase/ssr's
      // browser client hardcodes flowType: "pkce" (not overridable), and
      // supabase-js's own automatic URL detection explicitly REFUSES to
      // process an implicit-grant URL while the client is in PKCE mode — it
      // throws internally during client init, silently, so no session was
      // ever established and getSession() below always came back empty.
      // The fix is to read the hash and set the session ourselves rather
      // than rely on that auto-detection.
      const hashParams = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type");
      const code = searchParams.get("code");

      if (accessToken && refreshToken) {
        if (!verifyRef.current) {
          verifyRef.current = supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
        }
        const { error: setSessionError } = await verifyRef.current;
        if (setSessionError) {
          console.error("reset-password: setSession failed", setSessionError);
          if (active) setStatus("invalid");
          return;
        }
        window.history.replaceState(null, "", window.location.pathname);
      } else if (tokenHash && type) {
        if (!verifyRef.current) {
          verifyRef.current = supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as "invite" | "recovery" | "email" | "email_change" | "magiclink" | "signup",
          });
        }
        const { error: verifyError } = await verifyRef.current;
        if (verifyError) {
          console.error("reset-password: verifyOtp failed", verifyError);
          if (active) setStatus("invalid");
          return;
        }
      } else if (code) {
        if (!verifyRef.current) {
          verifyRef.current = supabase.auth.exchangeCodeForSession(code);
        }
        const { error: exchangeError } = await verifyRef.current;
        if (exchangeError) {
          console.error("reset-password: code exchange failed", exchangeError);
          if (active) setStatus("invalid");
          return;
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (active) setStatus(session ? "ready" : "invalid");
    })();
    return () => { active = false; };
  }, [searchParams]);

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await updatePassword(password);
      if (result.error) {
        // A reset link's session is short-lived. If it quietly expired while
        // this form sat open, Supabase fails the update with a session/token
        // error rather than anything about the password itself — that's not
        // something typing a different password fixes, so send them back to
        // ask for a fresh link instead of leaving a dead-end error banner on
        // a form they can't successfully submit.
        if (/session|token|jwt/i.test(result.error)) {
          setStatus("invalid");
          return;
        }
        setError(result.error);
        return;
      }
      router.replace("/profile");
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "checking") return null;

  return (
    <>
      <TopBar nav={false} />
      <main>
        <Section size="sm">
          <Shell width="narrow">
            {status === "invalid" ? (
              <div className="pt-12 text-center">
                <Mascot size={96} mood="wave" className="mx-auto" />
                <h1 className="mt-6">This link isn&rsquo;t valid</h1>
                <p className="prose-read mx-auto mt-3 max-w-[42ch]">
                  It may have expired or already been used; reset links are only good for one
                  use. Ask for a new one from the sign-in page.
                </p>
                <Button className="mt-8" onClick={() => router.replace("/join?mode=signin")}>
                  Back to sign in
                </Button>
              </div>
            ) : (
              <>
                <div className="text-center">
                  <p className="eyebrow eyebrow-accent justify-center">Reset your password</p>
                  <h1 className="mt-3">Choose a new password</h1>
                </div>

                <Card variant="clay" className="mt-9 p-6 sm:p-8">
                  <form onSubmit={handleSetPassword} noValidate className="space-y-5">
                    <div>
                      <label className="label" htmlFor="password">
                        New password
                      </label>
                      <input
                        id="password"
                        type="password"
                        required
                        minLength={6}
                        className="field"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                      />
                    </div>
                    <div>
                      <label className="label" htmlFor="confirm">
                        Confirm password
                      </label>
                      <input
                        id="confirm"
                        type="password"
                        required
                        minLength={6}
                        className="field"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        autoComplete="new-password"
                      />
                    </div>
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
                    <Button type="submit" size="lg" block disabled={submitting}>
                      {submitting ? "Saving…" : "Save password & continue"}
                    </Button>
                  </form>
                </Card>
              </>
            )}
          </Shell>
        </Section>
      </main>
      <Footer />
    </>
  );
}
