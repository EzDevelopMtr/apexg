/**
 * Cookies are per host, not per port: on one machine, every environment
 * served from localhost shares them. A prefix of its own (`COOKIE_PREFIX`)
 * keeps a development session from overwriting the production one; unset,
 * the names stay as they always were.
 */
const PREFIX = process.env.COOKIE_PREFIX ?? "apexg";

/**
 * Shared between `lib/auth-cookie.ts` (Route Handlers, Node runtime) and
 * `proxy.ts` (Edge runtime) — a plain constant, so it can be imported from
 * both without pulling in `next/headers`.
 */
export const SESSION_COOKIE_NAME = `${PREFIX}_session`;

/**
 * The slug of the gym last signed into from this browser. Not a secret: it
 * only lets `/login` and an expired session send people back to `/<slug>`.
 */
export const GYM_COOKIE_NAME = `${PREFIX}_gym`;

/** The super admin's token: apart from the gym session, so neither signs into the other. */
export const PLATFORM_COOKIE_NAME = `${PREFIX}_platform_session`;
