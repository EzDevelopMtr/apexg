import { NextResponse } from "next/server";
import { backendErrorMessage, callBackend } from "../../../../lib/backend-client";
import { readSessionCookie } from "../../../../lib/auth-cookie";

interface MeResponseBody {
  id: string;
  companyId: string;
  roleId: number;
  roleName: string;
  username: string;
  fullName: string;
}

/** Hydrates the client's session view from the cookie — the client never reads the token itself. */
export async function GET(): Promise<NextResponse> {
  const accessToken = await readSessionCookie();
  if (!accessToken) {
    return NextResponse.json({ message: "No autenticado." }, { status: 401 });
  }

  const result = await callBackend<MeResponseBody>("/auth/me", {
    method: "GET",
    accessToken,
  });

  if (result.status !== 200) {
    return NextResponse.json(
      { message: backendErrorMessage(result.body, "Sesión inválida.") },
      { status: result.status },
    );
  }

  return NextResponse.json({ user: result.body });
}
