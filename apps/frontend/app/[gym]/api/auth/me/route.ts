import { NextResponse } from "next/server";
import { backendErrorMessage, callBackend } from "../../../../../lib/backend-client";
import { signedOut } from "../../../../../lib/auth-cookie";
import { gymSession } from "../../../../../lib/gym-session";

type RouteContext = { params: Promise<{ gym: string }> };

interface MeResponseBody {
  id: string;
  companyId: string;
  roleId: number;
  roleName: string;
  username: string;
  fullName: string;
}

/**
 * This gym's session, as the backend sees it — or 401, even if another gym's
 * is open. A cookie the backend refuses (suspended gym, deactivated user,
 * rotated key, another gym's token) is cleared here: left in place, the proxy
 * would keep sending the entrance on to an app that cannot load.
 */
export async function GET(_request: Request, context: RouteContext): Promise<NextResponse> {
  const session = await gymSession((await context.params).gym);
  if (!session) return NextResponse.json({ message: "No autenticado." }, { status: 401 });
  if (!session.token) return signedOut(session.profile.slug, "No autenticado.");

  const result = await callBackend<MeResponseBody>("/auth/me", { method: "GET", accessToken: session.token });
  if (result.status !== 200) {
    return signedOut(session.profile.slug, backendErrorMessage(result.body, "Sesión inválida."), result.status);
  }
  // The backend verified the token; this checks it is the gym in the address.
  if (result.body.companyId !== session.profile.id) return signedOut(session.profile.slug, "No autenticado.");

  return NextResponse.json({ user: result.body });
}
