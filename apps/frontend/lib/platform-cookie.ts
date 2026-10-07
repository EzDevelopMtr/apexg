import "server-only";
import { cookies } from "next/headers";
import { PLATFORM_COOKIE_NAME } from "./session-cookie-name";

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
