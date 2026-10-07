/**
 * Cookies are per host, not per port: on one machine, every environment
 * served from localhost shares them. A prefix of its own (`COOKIE_PREFIX`)
 * keeps a development session from overwriting the production one; unset,
 * the names stay as they always were.
 */
const PREFIX = process.env.COOKIE_PREFIX ?? "apexg";

/**
 * A gym's session. Set with `Path=/<slug>`, so the browser itself sends it
 * only to that gym's pages and API (`/<slug>/...`): two gyms signed in at
 * once in two tabs each keep their own, and a tab can never act on the other.
 *
 * Shared between `lib/auth-cookie.ts` (Route Handlers) and `proxy.ts` — a
 * plain constant, so both can import it without pulling in `next/headers`.
 */
export const SESSION_COOKIE_NAME = `${PREFIX}_gym_session`;

/** The one session per browser of before, at `Path=/`: cleared on every sign-in. */
export const LEGACY_SESSION_COOKIE_NAME = `${PREFIX}_session`;

/**
 * The slug of the gym last signed into from this browser. Not a secret, and
 * never decides whose data is shown: it only sends `/login` and old
 * `/modules` links to `/<slug>`.
 */
export const GYM_COOKIE_NAME = `${PREFIX}_gym`;

/** The super admin's token: apart from the gym session, so neither signs into the other. */
export const PLATFORM_COOKIE_NAME = `${PREFIX}_platform_session`;
