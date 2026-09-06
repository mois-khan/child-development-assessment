import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { isSupabaseConfigured } from "./env";
import type { Database } from "./database.types";

/**
 * Server-side Supabase client (server components, route handlers, server
 * actions). Not wired into any page yet — this app is client-rendered
 * throughout — but ready for the moment a page needs server-side session
 * checks or service-role writes.
 */
export async function getSupabaseServerClient() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "getSupabaseServerClient() called with no Supabase credentials configured. " +
        "Check isSupabaseConfigured() first.",
    );
  }
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          for (const { name, value, options } of toSet) {
            cookieStore.set(name, value, options);
          }
        },
      },
    },
  );
}
