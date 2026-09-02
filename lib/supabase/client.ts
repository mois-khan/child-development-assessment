"use client";

import { createBrowserClient } from "@supabase/ssr";
import { isSupabaseConfigured } from "./env";

let cached: ReturnType<typeof createBrowserClient> | null = null;

/**
 * Browser-side Supabase client. Only call this behind an
 * isSupabaseConfigured() check — every caller in this app already does,
 * so this throws loudly rather than silently returning something broken
 * if that check was skipped.
 */
export function getSupabaseBrowserClient() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "getSupabaseBrowserClient() called with no Supabase credentials configured. " +
        "Check isSupabaseConfigured() first.",
    );
  }
  if (!cached) {
    cached = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }
  return cached;
}
