// Gates every page under /admin (except /admin/login) behind a valid admin
// session cookie, redirecting to /admin/login when absent/invalid.
//
// Note: Next.js 16 renamed the `middleware.ts` file convention to
// `proxy.ts` (functionally identical, just renamed) — see
// node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md.
// This is the Next 16 equivalent of what would previously have been
// `middleware.ts`.
//
// This only protects the admin *pages* (frontend-engineer's /admin routes).
// Every /api/admin/* route handler also independently calls
// requireAdminSession() itself (see src/lib/adminSession.ts) as
// defense-in-depth, since proxy matchers can silently stop covering a route
// after a refactor.
import { NextResponse, type NextRequest } from "next/server";
import { requireAdminSession } from "@/lib/adminSession";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  if (!requireAdminSession(request)) {
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
