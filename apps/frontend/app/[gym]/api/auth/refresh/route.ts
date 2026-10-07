import { NextResponse } from "next/server";
import { backendErrorMessage, callBackend } from "../../../../../lib/backend-client";
import { setSessionCookie, signedOut } from "../../../../../lib/auth-cookie";
import { gymSession } from "../../../../../lib/gym-session";

type RouteContext = { params: Promise<{ gym: string }> };

interface RefreshResponseBody {
  accessToken: string;
  expiresIn: number;
}

/** Renews this gym's session and keeps its cookie on this gym's path. */
export async function POST(_request: Request, context: RouteContext): Promise<NextResponse> {
  const session = await gymSession((await context.params).gym);
  if (!session?.token) {
    return NextResponse.json({ message: "No autenticado." }, { status: 401 });
  }

  const result = await callBackend<RefreshResponseBody>("/auth/refresh", {
    method: "POST",
    accessToken: session.token,
  });

  if (result.status !== 200) {
    return signedOut(session.profile.slug, backendErrorMessage(result.body, "Sesión inválida."), result.status);
  }

  await setSessionCookie(session.profile.slug, result.body.accessToken, result.body.expiresIn);
  return NextResponse.json({ expiresIn: result.body.expiresIn });
}
