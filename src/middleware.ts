import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/jwt";

// ─── What is Middleware? ──────────────────────────────────────────
// Middleware is a function that runs on EVERY request BEFORE the
// page or API route handler executes. It runs on the Edge Runtime —
// meaning it runs at the CDN edge, geographically close to the user,
// with near-zero latency. No cold starts, no Node.js overhead.
//
// The execution order for every request is:
//   1. middleware.ts        ← runs first, always
//   2. layout.tsx           ← then the layout
//   3. page.tsx             ← then the page
//
// This is why middleware is the perfect place for auth checks —
// we can redirect BEFORE any page renders, with zero flash.
// ─────────────────────────────────────────────────────────────────

// ─── Route definitions ────────────────────────────────────────────
// Centralize all route strings here. If you rename a route,
// you only change it in one place.
// ─────────────────────────────────────────────────────────────────
const PROTECTED_ROUTES = ["/dashboard", "/profile"];
const AUTH_ROUTES = ["/login", "/register", "/verify-email"];
const PUBLIC_ROUTES = ["/", "/about"];

// ─── Route helpers ────────────────────────────────────────────────
function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((route) => pathname.startsWith(route));
}

// ─── Main middleware function ─────────────────────────────────────
// NextResponse has four options:
//   NextResponse.next()         → continue to the page/route normally
//   NextResponse.redirect(url)  → 307 redirect to another URL
//   NextResponse.rewrite(url)   → serve a different URL, same visible URL
//   NextResponse.json(...)      → return a JSON response directly
// ─────────────────────────────────────────────────────────────────
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Step 1: Read access token from Authorization header ───────
  // We store the access token in memory on the client and send it
  // as a custom request header on every fetch call.
  // Middleware can read request headers — this is how it sees the token.
  //
  // Why not read from cookie here?
  // The ACCESS token is in memory (not a cookie) — it's the REFRESH
  // token that lives in the httpOnly cookie. Middleware reads the
  // access token from the header the client sends.
  const accessToken = req.headers.get("x-access-token");

  // ── Step 2: Verify the token ──────────────────────────────────
  // verifyAccessToken returns the decoded payload or null.
  // null means: missing, expired, tampered, or wrong type.
  const payload = accessToken ? verifyAccessToken(accessToken) : null;
  const isAuthenticated = payload !== null;

  // ── Step 3: Protected route logic ─────────────────────────────
  if (isProtectedRoute(pathname)) {
    if (!isAuthenticated) {
      // Not logged in → redirect to login
      // We append ?from= so after login we can redirect back
      // to where the user was trying to go (better UX)
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // ── Role-based access control (RBAC) ──────────────────────
    // Example: only admins can visit /dashboard/admin/*
    // You can expand this pattern for any role-restricted route.
    if (pathname.startsWith("/dashboard/admin") && payload?.role !== "admin") {
      // Authenticated but wrong role → redirect to dashboard
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Authenticated and authorized → continue normally
    // But also forward the user info as a header so layouts/pages
    // can read it WITHOUT another DB call (optimization)
    const response = NextResponse.next();
    response.headers.set("x-user-id", payload.userId);
    response.headers.set("x-user-email", payload.email);
    response.headers.set("x-user-role", payload.role);
    return response;
  }

  // ── Step 4: Auth route logic ──────────────────────────────────
  // If the user is ALREADY logged in and tries to visit /login or
  // /register, redirect them to dashboard — no point showing the
  // auth pages to someone who's already authenticated.
  if (isAuthRoute(pathname) && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // ── Step 5: Everything else → pass through ────────────────────
  return NextResponse.next();
}

// ─── Matcher config ───────────────────────────────────────────────
// This is critical. Without a matcher, middleware runs on EVERY
// single request — including _next/static (CSS, JS bundles),
// _next/image (optimized images), favicon.ico, etc.
//
// That would massively slow down asset loading for zero benefit.
//
// The matcher below tells Next.js: "only run middleware on actual
// page and API routes, skip all static assets."
// ─────────────────────────────────────────────────────────────────
export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     *   - _next/static  (Next.js static files: JS chunks, CSS)
     *   - _next/image   (Next.js image optimization)
     *   - favicon.ico
     *   - public folder files (png, jpg, svg, etc.)
     *
     * The negative lookahead (?!...) regex handles all of these.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
