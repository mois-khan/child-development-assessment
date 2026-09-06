import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
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
