import { NextResponse } from "next/server";
import { clearSessionCookie } from "../../../../lib/auth-cookie";

/**
 * Ends the session. Purely local: there is no server-side token revocation
 * (RF-01 phase 2, no refresh/session table yet) — this just drops the
 * cookie, so the access token stays valid until its own 15-minute expiry.
 */
export async function POST(): Promise<NextResponse> {
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
