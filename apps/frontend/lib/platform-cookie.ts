import "server-only";
import { cookies } from "next/headers";

/**
 * The super admin's token. A cookie of its own, apart from the gym session:
 * signing into the panel never signs anyone into a gym, nor the reverse.
 */
const PLATFORM_COOKIE_NAME = "apexg_platform_session";

export async function setPlatformCookie(token: string, maxAgeSeconds: number): Promise<void> {
  (await cookies()).set(PLATFORM_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: maxAgeSeconds,
  });
}

export async function readPlatformCookie(): Promise<string | undefined> {
  return (await cookies()).get(PLATFORM_COOKIE_NAME)?.value;
}

export async function clearPlatformCookie(): Promise<void> {
  (await cookies()).delete(PLATFORM_COOKIE_NAME);
}
