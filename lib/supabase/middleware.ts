import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "./env";

/**
 * Keeps the auth cookies fresh on every request.
 *
 * Supabase access tokens are short-lived. Without this, a parent who leaves
 * a tab open long enough comes back to a session that looks signed in on the
 * client but fails on the next write — the confusing kind of broken, where
 * nothing says what went wrong. Refreshing here means the token is already
 * valid by the time any page or route handler reads it.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // No credentials configured (a fresh clone, CI) — do nothing rather than
  // throwing on every single request.
  if (!isSupabaseConfigured()) return response;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          for (const { name, value } of toSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of toSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // Touching getUser() is what actually performs the refresh. Do not remove
  // it in the name of "we don't use the result here".
  await supabase.auth.getUser();

  return response;
}
