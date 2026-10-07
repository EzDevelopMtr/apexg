import { NextResponse } from "next/server";
import { clearSessionCookie } from "../../../../../lib/auth-cookie";
import { findCompanyProfile } from "../../../../../lib/company-profile";

type RouteContext = { params: Promise<{ gym: string }> };

/** Signs out of this gym only: another gym open in another tab stays signed in. */
export async function POST(_request: Request, context: RouteContext): Promise<NextResponse> {
  const { gym } = await context.params;
  const profile = await findCompanyProfile(gym);
  await clearSessionCookie(profile?.slug ?? gym);
  return NextResponse.json({ ok: true });
}
