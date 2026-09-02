/**
 * Whether real Supabase credentials are present.
 *
 * Every Supabase-backed code path in this app checks this first and falls
 * back to a local (browser-only) implementation when it's false — see
 * lib/admin/data.ts and lib/admin/auth.ts. That's what lets the admin portal
 * (and the rest of the app) run with zero setup before credentials exist,
 * and switch over to real Supabase the moment they're added to .env.local —
 * no code change required.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
