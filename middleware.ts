import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * The set of admin routes that map directly to a page_id in admin_pages.
 * Routes not listed here are not page-gated (they may be sub-routes of a
 * gated page, e.g. /admin/leads/[id] falls under "leads").
 */
const PAGE_GATE: Record<string, string> = {
  "/admin/parents":          "parents",
  "/admin/children":         "children",
  "/admin/assessments":      "assessments",
  "/admin/purchases":        "purchases",
  "/admin/leads":            "leads",
  "/admin/item-bank":        "item-bank",
  "/admin/milestone-videos": "milestone-videos",
  "/admin/courses":          "courses",
  "/admin/users":            "users",
};

/**
 * Map a pathname to the page_id it belongs to, accounting for sub-routes.
 * e.g. /admin/leads/abc123 → "leads"
 */
function pageIdForPath(path: string): string | null {
  // Exact matches first
  if (PAGE_GATE[path]) return PAGE_GATE[path];
  // Sub-route matches (e.g. /admin/leads/[id])
  for (const prefix of Object.keys(PAGE_GATE)) {
    if (path.startsWith(prefix + "/")) return PAGE_GATE[prefix];
  }
  return null;
}

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);
  const path = request.nextUrl.pathname;

  // ── Admin routes ────────────────────────────────────────────────────────────
  if (path.startsWith("/admin")) {
    // Login and unauthorized pages are always public to admin routes
    if (path === "/admin/login" || path === "/admin/unauthorized") return response;

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
      .select("id, role")
      .eq("id", user.id)
      .maybeSingle();

    if (!adminRow) {
      return NextResponse.redirect(
        new URL("/admin/login?error=not_admin", request.url)
      );
    }

    // 3. super_admin bypasses all page-level checks
    if (adminRow.role === "super_admin") return response;

    // 4. Dashboard is always accessible to any admin user
    if (path === "/admin" || path === "/admin/") return response;

    // 5. For all other gated pages, check the access table via the DB function
    const pageId = pageIdForPath(path);
    if (pageId) {
      const { data: hasAccess } = await supabase.rpc("has_page_access", { page: pageId });
      if (!hasAccess) {
        return NextResponse.redirect(
          new URL("/admin/unauthorized", request.url)
        );
      }
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

