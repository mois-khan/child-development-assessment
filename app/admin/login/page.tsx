"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { startDevSession, useAdminSession } from "@/lib/admin/auth";
import { Badge, Button, Card, IconShield, Shell, Wordmark } from "@/components/ui";

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <AdminLoginInner />
    </Suspense>
  );
}

function AdminLoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, loading } = useAdminSession();
  const configured = isSupabaseConfigured();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(
    searchParams.get("error") === "not_admin"
      ? "This account does not have admin access. Please use your admin credentials."
      : ""
  );
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && session) router.replace("/admin");
  }, [loading, session, router]);

  async function handleDevContinue() {
    startDevSession();
    router.replace("/admin");
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const { getSupabaseBrowserClient } = await import("@/lib/supabase/client");
      const supabase = getSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(signInError.message);
        return;
      }
      router.replace("/admin");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return null;

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
          {configured ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              <h1 className="!text-xl">Sign in</h1>
              <div>
                <label className="label" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  className="field"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                />
              </div>
              <div>
                <label className="label" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  className="field"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              {error && (
                <p className="text-sm font-semibold text-[var(--st-consult)]">{error}</p>
              )}
              <Button type="submit" block disabled={submitting}>
                {submitting ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          ) : (
            <div className="space-y-4 text-center">
              <h1 className="!text-xl">No Supabase project connected yet</h1>
              <p className="text-sm leading-relaxed text-ink-3">
                Real sign-in turns on the moment Supabase credentials are added to{" "}
                <code className="rounded bg-surface-2 px-1.5 py-0.5 text-sm">
                  .env.local
                </code>
                . Until then, use the dev session below to explore the admin portal — it only
                affects this browser and has no real access control.
              </p>
              <Button block onClick={handleDevContinue}>
                Continue as dev admin
              </Button>
            </div>
          )}
        </Card>
      </Shell>
    </main>
  );
}
