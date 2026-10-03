import { NextResponse } from "next/server";
import { clearPlatformCookie } from "../../../../lib/platform-cookie";

export async function POST(): Promise<NextResponse> {
  await clearPlatformCookie();
  return NextResponse.json({ ok: true });
}
