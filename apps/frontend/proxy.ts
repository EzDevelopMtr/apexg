import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { GYM_COOKIE_NAME, SESSION_COOKIE_NAME } from "./lib/session-cookie-name";
import { isUnexpired } from "./lib/token-claims";

/**
 * RF-02/RNF-03: keeps signed-out visitors off private pages, server-side —
 * the real guard `SessionGuard`/`RequireModule` used to be a client effect
 * that let the page ship first and bounce after. This decides before any
 * HTML renders.
 *
 * Every gym lives under its own address: `/<slug>` is its entrance and
 * `/<slug>/modules/...` its app. The session cookie is scoped to that path,
 * so what arrives here under `/<slug>/` is that gym's session or none — two
 * gyms open in two tabs never see each other's.
 *
 * Named `proxy` (not `middleware`) per Next.js 16's renamed convention.
 *
 * Still not the authorization boundary: it only checks that the cookie holds
 * an unexpired token, decoded without verifying its signature — every
 * request re-verifies it at the backend. This is a UX redirect.
 */

/** Top-level paths that are never a gym: the backend keeps slugs off them (company-slug.ts). */
const NOT_A_GYM = new Set(["admin", "api", "login", "logout", "dashboard", "modules"]);
/** The single-gym paths of before: sent on to the gym this browser last used. */
const LEGACY_ROOTS = new Set(["dashboard", "modules"]);
const SLUG = /^[a-z0-9-]+$/;

function redirectTo(request: NextRequest, pathname: string): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  return NextResponse.redirect(url);
}

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const [first = "", second] = pathname.split("/").slice(1);

  if (LEGACY_ROOTS.has(first)) {
    const gym = request.cookies.get(GYM_COOKIE_NAME)?.value;
    return redirectTo(request, gym && SLUG.test(gym) ? `/${gym}${pathname}` : "/login");
  }

  // The platform panel has its own session; a gym's API routes check theirs.
  if (!SLUG.test(first) || NOT_A_GYM.has(first) || second === "api") {
    return NextResponse.next();
  }

  const signedIn = isUnexpired(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  const entrance = second === undefined || second === "";

  if (entrance && signedIn) return redirectTo(request, `/${first}/modules`);
  if (!entrance && !signedIn) return redirectTo(request, `/${first}`);
  return NextResponse.next();
}

/**
 * Anything with a file extension is a static asset from `public/` and must not
 * be guarded: the login page's own background and the favicon live there, and
 * a signed-out visitor — the only kind that ever sees the login — would have
 * them redirected to `/login` instead of served. No route in this app has a
 * dot in it, so matching on the extension is safe.
 */
export const config = {
  matcher: ["/((?!api/|_next/|.*\\..*).*)"],
};
