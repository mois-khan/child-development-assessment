"use client";

import { useCallback, useEffect, useState } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * Admin auth, in two modes:
 *
 *  - Supabase configured: real email/password sign-in via Supabase Auth,
 *    gated by a matching row in admin_users (see supabase/migrations/0002).
 *  - Not configured (today): a "dev session" flag in localStorage. Anyone
 *    who clicks "Continue as dev admin" gets in — this is a local
 *    development convenience, not a real access boundary, which is fine
 *    because there is no real data behind it yet either.
 *
 * Every admin page reads its session through useAdminSession() below, so the
 * day credentials are added, sign-in becomes real everywhere at once with no
 * further changes to the pages themselves.
 */

const DEV_SESSION_KEY = "kaushalya.admin.dev-session";
const DEV_ADMIN_EMAIL = "dev-admin@local";

export interface AdminSession {
  id: string;
  email: string;
  role: "super_admin" | "sales" | "content_editor";
  /** True when this is the local dev-mode bypass, not a real signed-in admin. */
  isDevSession: boolean;
}

function readDevSession(): AdminSession | null {
  if (typeof window === "undefined") return null;
  if (window.localStorage.getItem(DEV_SESSION_KEY) !== "1") return null;
  return { id: "00000000-0000-0000-0000-000000000000", email: DEV_ADMIN_EMAIL, role: "super_admin", isDevSession: true };
}

export function startDevSession(): void {
  window.localStorage.setItem(DEV_SESSION_KEY, "1");
}

export function endDevSession(): void {
  window.localStorage.removeItem(DEV_SESSION_KEY);
}

/**
 * Client-side admin session hook. `loading` is true only until the initial
 * check resolves (localStorage read, or a Supabase session fetch) — after
 * that, `session` is either the signed-in admin or null.
 */
export function useAdminSession(): {
  session: AdminSession | null;
  loading: boolean;
  signOut: () => Promise<void>;
} {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    if (!isSupabaseConfigured()) {
      setSession(readDevSession());
      setLoading(false);
      return;
    }

    (async () => {
      const { getSupabaseBrowserClient } = await import("@/lib/supabase/client");
      const supabase = getSupabaseBrowserClient();
      const {
        data: { session: authSession },
      } = await supabase.auth.getSession();

      if (!authSession) {
        if (!cancelled) {
          setSession(null);
          setLoading(false);
        }
        return;
      }

      const { data: adminRow } = await supabase
        .from("admin_users")
        .select("email, role")
        .eq("id", authSession.user.id)
        .maybeSingle();

      if (!cancelled) {
        setSession(
          adminRow
            ? { id: authSession.user.id, email: adminRow.email, role: adminRow.role, isDevSession: false }
            : null,
        );
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured()) {
      const { getSupabaseBrowserClient } = await import("@/lib/supabase/client");
      await getSupabaseBrowserClient().auth.signOut();
    } else {
      endDevSession();
    }
    setSession(null);
  }, []);

  return { session, loading, signOut };
}
