"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * Who is signed in, app-wide.
 *
 * One provider at the root, one hook everywhere else. Pages never call
 * supabase.auth themselves — that's how you end up with five components
 * disagreeing about whether someone is logged in.
 */

export interface ParentProfile {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  createdAt: string;
}

interface AuthState {
  /** undefined while we're still finding out — distinct from "signed out". */
  user: User | null | undefined;
  profile: ParentProfile | null;
  loading: boolean;
  signUp: (input: SignUpInput) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export interface SignUpInput {
  fullName: string;
  phone: string;
  email: string;
  password: string;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [profile, setProfile] = useState<ParentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (id: string) => {
    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, phone, email, created_at")
      .eq("id", id)
      .maybeSingle();

    setProfile(
      data
        ? {
            id: data.id as string,
            fullName: (data.full_name as string) ?? "",
            phone: (data.phone as string) ?? "",
            email: (data.email as string) ?? "",
            createdAt: data.created_at as string,
          }
        : null,
    );
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setUser(null);
      setLoading(false);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    let active = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setUser(data.user ?? null);
      if (data.user) void loadProfile(data.user.id);
      setLoading(false);
    });

    // Keeps every tab in step — signing out in one signs out the rest.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setUser(session?.user ?? null);
      if (session?.user) void loadProfile(session.user.id);
      else setProfile(null);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signUp = useCallback(async ({ fullName, phone, email, password }: SignUpInput) => {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Read by the on_auth_user_created trigger, which creates the profile
        // and the lead. Names must match what the SQL looks for.
        data: { full_name: fullName, phone },
      },
    });
    return { error: error ? friendlyAuthError(error.message) : null };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? friendlyAuthError(error.message) : null };
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await loadProfile(user.id);
  }, [user, loadProfile]);

  const value = useMemo<AuthState>(
    () => ({ user, profile, loading, signUp, signIn, signOut, refreshProfile }),
    [user, profile, loading, signUp, signIn, signOut, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth() used outside <AuthProvider>");
  return ctx;
}

/**
 * Supabase's auth errors are written for developers. These are the four a
 * parent can actually hit, rewritten for someone who is not one.
 */
function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("already registered") || m.includes("already been registered")) {
    return "There's already an account with this email. Try signing in instead.";
  }
  if (m.includes("invalid login credentials")) {
    return "That email and password don't match. Check them and try again.";
  }
  if (m.includes("password")) {
    return "Your password needs to be at least 6 characters.";
  }
  if (m.includes("email")) {
    return "That doesn't look like a valid email address.";
  }
  return message;
}
