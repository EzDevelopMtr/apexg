import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "./session-cookie-name";

/**
 * The access token lives ONLY in this httpOnly cookie — never in
 * localStorage/sessionStorage, never in a response body a client component
 * can read. Route Handlers read it server-side to call the real backend;
 * browser JS never sees the value.
 */

export async function setSessionCookie(
  accessToken: string,
  maxAgeSeconds: number,
): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
}

export async function readSessionCookie(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(SESSION_COOKIE_NAME)?.value;
}
