/**
 * Shared between `lib/auth-cookie.ts` (Route Handlers, Node runtime) and
 * `proxy.ts` (Edge runtime) — a plain constant, so it can be imported from
 * both without pulling in `next/headers`.
 */
export const SESSION_COOKIE_NAME = "apexg_session";
