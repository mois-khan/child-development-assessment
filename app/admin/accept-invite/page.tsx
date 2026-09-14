"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge, Button, Card, IconShield, Shell, Wordmark } from "@/components/ui";

/**
 * Where both a Supabase admin-invite AND a password-reset email land (see
 * the `redirect_to` on /api/admin/invite, and the `redirectTo` on
 * resetPasswordForEmail() in app/admin/login/page.tsx). Both are the same
 * screen from here on: exchange the link's code for a session, then let
 * whoever it belongs to set a password. Before this page existed for
 * invites, the invite created the admin_users row immediately but there
 * was nowhere for the invitee to ever set a password — signing in was a
 * dead end.
 */
export default function AcceptInvitePage() {
  return (
    <Suspense fallback={null}>
      <AcceptInviteInner />
    </Suspense>
  );
}

function AcceptInviteInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"checking" | "ready" | "invalid">("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // Supabase's invite/reset link is single-use, and this effect must not
  // consume it twice — in dev, React Strict Mode deliberately fires effects
  // twice on mount, and the second call would reuse an already-spent code
  // and fail. Skipping the second call outright isn't enough on its own: it
  // would race ahead to getSession() before the first (real) call has
  // finished, and see no session yet. Sharing one promise between both
  // invocations means the second one just waits for the same in-flight call
  // instead of racing it or repeating it.
  const verifyRef = useRef<Promise<{ error: { message: string } | null }> | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const { getSupabaseBrowserClient } = await import("@/lib/supabase/client");
      const supabase = getSupabaseBrowserClient();

      // Confirmed against a real generated invite link: Supabase's
      // invite/recovery email lands here with the tokens in the URL HASH —
      // #access_token=...&refresh_token=...&type=invite — an implicit-grant
      // callback, not a `code` or `token_hash` query param. That matters
      // because @supabase/ssr's browser client hardcodes flowType: "pkce"
      // (not overridable), and supabase-js's own automatic URL detection
      // explicitly REFUSES to process an implicit-grant URL while the
      // client is in PKCE mode — it throws internally during client init,
      // silently, so no session is ever established and getSession() below
      // always came back empty. The fix is to read the hash and set the
      // session ourselves rather than rely on that auto-detection.
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
          console.error("accept-invite: setSession failed", setSessionError);
          if (active) setStatus("invalid");
          return;
        }
        // Matches supabase-js's own behaviour for a successful implicit
        // callback — the access/refresh tokens shouldn't linger in the URL
        // bar or browser history once they've done their job.
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
          console.error("accept-invite: verifyOtp failed", verifyError);
          if (active) setStatus("invalid");
          return;
        }
      } else if (code) {
        if (!verifyRef.current) {
          verifyRef.current = supabase.auth.exchangeCodeForSession(code);
        }
        const { error: exchangeError } = await verifyRef.current;
        if (exchangeError) {
          console.error("accept-invite: code exchange failed", exchangeError);
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
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setSubmitting(true);
    try {
      const { getSupabaseBrowserClient } = await import("@/lib/supabase/client");
      const supabase = getSupabaseBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
        return;
      }

      // This page is the shared landing spot for staff invites, school
      // invites, and admin password resets — the right home afterward
      // depends on which kind of account this is.
      const { data: { user } } = await supabase.auth.getUser();
      const { data: adminRow } = await supabase
        .from("admin_users")
        .select("id")
        .eq("id", user!.id)
        .maybeSingle();
      if (adminRow) {
        router.replace("/admin");
        return;
      }
      const { data: schoolRow } = await supabase
        .from("schools")
        .select("id")
        .eq("id", user!.id)
        .maybeSingle();
      router.replace(schoolRow ? "/school" : "/admin/login?error=not_admin");
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "checking") return null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--ground-2)] px-5 py-16">
      <Shell width="reading" className="!max-w-[26rem]">
        <div className="mb-8 flex flex-col items-center text-center">
          <Wordmark height={40} />
          <Badge tone="accent" icon={<IconShield size={14} />} className="mt-4">
            Admin portal
          </Badge>
        </div>

        <Card variant="clay" className="!p-7">
          {status === "invalid" ? (
            <div className="space-y-3 text-center">
              <h1 className="!text-xl">This link isn&rsquo;t valid</h1>
              <p className="text-sm leading-relaxed text-ink-3">
                It may have expired or already been used. Ask your super admin to send a new
                invite, or request a new reset link from the sign-in page.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSetPassword} className="space-y-4">
              <h1 className="!text-xl">Set your password</h1>
              <p className="text-sm text-ink-3">
                Choose a password for your admin account.
              </p>
              <div>
                <label className="label" htmlFor="password">
                  New password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={8}
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
                  minLength={8}
                  className="field"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              {error && (
                <p className="text-sm font-semibold text-[var(--st-consult)]">{error}</p>
              )}
              <Button type="submit" block disabled={submitting}>
                {submitting ? "Saving…" : "Set password & continue"}
              </Button>
            </form>
          )}
        </Card>
      </Shell>
    </main>
  );
}
