import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { LEGACY_SESSION_COOKIE_NAME, SESSION_COOKIE_NAME } from "./session-cookie-name";

/**
 * The only code allowed to touch a gym's session cookie. httpOnly, so the
 * token never reaches browser JS; scoped to `/<gym>` (see
 * `session-cookie-name.ts`), so each gym's tabs carry only that gym's token.
 */

const gymPath = (gym: string) => `/${gym}`;

export async function setSessionCookie(gym: string, accessToken: string, maxAgeSeconds: number): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: gymPath(gym),
    maxAge: maxAgeSeconds,
  });
  // The single browser-wide session of before would still ride along on
  // every request: gone at the first sign-in.
  store.delete({ name: LEGACY_SESSION_COOKIE_NAME, path: "/" });
}

export async function clearSessionCookie(gym: string): Promise<void> {
  (await cookies()).delete({ name: SESSION_COOKIE_NAME, path: gymPath(gym) });
}

/**
 * A refusal that also drops this gym's cookie, set on the response itself
 * (a GET handler's `cookies().delete` did not reach the browser). Without it,
 * a session the backend refuses — suspended gym, deactivated user, another
 * gym's token — would keep sending the entrance on to an app that cannot load.
 */
export function signedOut(gym: string, message: string, status = 401): NextResponse {
  const response = NextResponse.json({ message }, { status });
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: gymPath(gym),
    maxAge: 0,
  });
  return response;
}

/**
 * The session the browser sent with this request. Under `/<gym>/...` only
 * that gym's cookie matches the path, so this is that gym's or nothing.
 */
export async function readSessionCookie(): Promise<string | undefined> {
  return (await cookies()).get(SESSION_COOKIE_NAME)?.value;
}
