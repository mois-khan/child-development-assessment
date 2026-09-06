import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);
  const path = request.nextUrl.pathname;

  // ── Admin routes ────────────────────────────────────────────────────────────
  if (path.startsWith("/admin")) {
    // The login page itself is always public
    if (path === "/admin/login") return response;

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: () => {},
        },
      }
    );

    // 1. Must be authenticated at all
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.redirect(
        new URL(`/admin/login?next=${encodeURIComponent(path)}`, request.url)
      );
    }

    // 2. Must be in admin_users — a parent who's logged in must NOT reach admin pages
    const { data: adminRow } = await supabase
      .from("admin_users")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (!adminRow) {
      // Authenticated but not an admin — redirect to admin login with a message
      return NextResponse.redirect(
        new URL("/admin/login?error=not_admin", request.url)
      );
    }

    return response;
  }

  // ── Parent-only routes ─────────────────────────────────────────────────────
  if (
    path.startsWith("/children") ||
    path.startsWith("/assessment") ||
    path.startsWith("/report")
  ) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: () => {},
        },
      }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.redirect(
        new URL(`/join?next=${encodeURIComponent(path)}`, request.url)
      );
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|pdf)$).*)",
  ],
};
