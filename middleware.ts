import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { updateSession } from "@/lib/supabase/middleware";
import { isSupabaseConfigured } from "@/lib/supabase/env";

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
  "/admin/schools":          "schools",
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
    // Login, unauthorized, and invite-acceptance pages are always public to
    // admin routes — accept-invite runs before the invitee has a password
    // set, so it can't sit behind the auth check below.
    if (path === "/admin/login" || path === "/admin/unauthorized" || path === "/admin/accept-invite") {
      return response;
    }

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
  //
  // Everything a signed-in account owns — a school owns children and
  // assessments exactly the way a parent does (see 0007_schools.sql), so
  // this list gates by "signed in" rather than by account type. /dashboard
  // is the one exception, handled separately below: it's a parent's home,
  // and a school has its own at /school.
  const PARENT_ONLY = ["/dashboard", "/children", "/assessment", "/report", "/profile"];
  const SCHOOL_ONLY = ["/school"];

  // ── Routes that only make sense signed OUT ─────────────────────────────────
  //
  // The marketing homepage and the sign-in screen. Landing a signed-in parent
  // on either is the flow bug this list fixes: "/" is a pitch for a product
  // they already bought, and /join is a form for an account they already have.
  const SIGNED_OUT_ONLY = ["/", "/join"];

  const isSchoolPath = SCHOOL_ONLY.some((p) => path === p || path.startsWith(p + "/"));
  const needsAuth =
    isSchoolPath || PARENT_ONLY.some((p) => path === p || path.startsWith(p + "/"));
  const isSignedOutOnly = SIGNED_OUT_ONLY.includes(path);

  // With no credentials configured (a fresh clone, CI) there is no session to
  // read and nothing to route on — every page is public and renders as it
  // did before. Without this guard the homepage would throw on every hit.
  if ((needsAuth || isSignedOutOnly) && isSupabaseConfigured()) {
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

    if (needsAuth && !user) {
      return NextResponse.redirect(
        new URL(`/join?next=${encodeURIComponent(path)}`, request.url)
      );
    }

    // A school's home is /school; a parent's is /dashboard. The two are
    // mutually exclusive, so a signed-in account on the wrong one is sent
    // straight to its own rather than shown an empty state for a family
    // (or roster) it doesn't have. Only checked on these two paths — every
    // other PARENT_ONLY route (children, assessment, report, profile)
    // already scopes correctly by profile_id regardless of account type.
    if (user && (path === "/dashboard" || isSchoolPath)) {
      const { data: schoolRow } = await supabase
        .from("schools")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();
      const isSchool = !!schoolRow;

      if (path === "/dashboard" && isSchool) {
        return NextResponse.redirect(new URL("/school", request.url));
      }
      if (isSchoolPath && !isSchool) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }

    if (isSignedOutOnly && user) {
      // /join carries ?next= when something bounced the visitor here. Honour
      // it — a parent who clicked a report link and got asked to sign in
      // should land on the report, not on a generic dashboard.
      const next = request.nextUrl.searchParams.get("next");
      if (next && next.startsWith("/") && !next.startsWith("//")) {
        return NextResponse.redirect(new URL(next, request.url));
      }

      // Staff are auth.users too, and a staff account usually has no children
      // — sending them to the parent dashboard would show them an empty
      // state for a family they don't have. Their home is the admin panel.
      const { data: adminRow } = await supabase
        .from("admin_users")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();
      if (adminRow) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }

      // Same idea for a school account: /dashboard is a parent's family
      // overview, and a school signing in has no family — it has a roster.
      const { data: schoolRow } = await supabase
        .from("schools")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      return NextResponse.redirect(
        new URL(schoolRow ? "/school" : "/dashboard", request.url)
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

