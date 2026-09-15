import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "./lib/session-cookie-name";

/**
 * RF-02/RNF-03: keeps signed-out visitors off private pages, server-side —
 * the real guard `SessionGuard`/`RequireModule` used to be a client effect
 * that let the page ship first and bounce after. This decides before any
 * HTML renders.
 *
 * Named `proxy` (not `middleware`) per Next.js 16's renamed convention —
 * same request-interception mechanism, new file/export name.
 *
 * Still not the authorization boundary: it only checks that the cookie
 * holds an unexpired token, decoded without verifying its signature (this
 * runs on the Edge runtime, with no access to the JWT secret, and does not
 * need it — every proxied request re-verifies the signature at the real
 * backend). This is a UX redirect, not the thing that actually protects
 * the data.
 */

const PUBLIC_PATHS = new Set(["/login"]);

function decodeJwtPayload(token: string): { exp?: number } | undefined {
  const segments = token.split(".");
  const payloadSegment = segments[1];
  if (segments.length !== 3 || !payloadSegment) {
    return undefined;
  }
  try {
    const base64 = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    return JSON.parse(atob(padded)) as { exp?: number };
  } catch {
    return undefined;
  }
}

function hasValidSession(request: NextRequest): boolean {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return false;
  }
  const payload = decodeJwtPayload(token);
  return typeof payload?.exp === "number" && payload.exp * 1000 > Date.now();
}

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const authenticated = hasValidSession(request);
  const isPublicPath = PUBLIC_PATHS.has(pathname);

  if (!authenticated && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (authenticated && isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/modules";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
