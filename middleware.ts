import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);
  const path = request.nextUrl.pathname;
  
  if (path.startsWith("/children") || path.startsWith("/assessment") || path.startsWith("/admin")) {
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
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      return NextResponse.redirect(new URL(`/join?next=${encodeURIComponent(path)}`, request.url));
    }
  }

  return response;
}

export const config = {
  /**
   * Everything except static assets and image files. Notably this DOES run on
   * the public marketing pages: browsing without an account has to stay
   * possible, but a visitor who already signed in should be recognised there
   * too, so the header can say so.
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|pdf)$).*)",
  ],
};
