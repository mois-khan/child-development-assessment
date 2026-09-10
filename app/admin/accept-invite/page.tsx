"use client";

import { Suspense, useEffect, useState } from "react";
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

  useEffect(() => {
    let active = true;
    (async () => {
      const { getSupabaseBrowserClient } = await import("@/lib/supabase/client");
      const supabase = getSupabaseBrowserClient();

      const code = searchParams.get("code");
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
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
      router.replace("/admin");
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
