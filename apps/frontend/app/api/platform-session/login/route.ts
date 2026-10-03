import { NextResponse } from "next/server";
import { backendErrorMessage, callBackend } from "../../../../lib/backend-client";
import { setPlatformCookie } from "../../../../lib/platform-cookie";

interface PlatformLoginBody {
  readonly accessToken: string;
  readonly expiresIn: number;
}

/** Signs the super admin in and keeps the token in its own httpOnly cookie. */
export async function POST(request: Request): Promise<NextResponse> {
  const credentials = (await request.json().catch(() => null)) as
    | { email?: unknown; password?: unknown }
    | null;
  if (typeof credentials?.email !== "string" || typeof credentials.password !== "string") {
    return NextResponse.json({ message: "Correo y contraseña son obligatorios." }, { status: 400 });
  }

  const result = await callBackend<PlatformLoginBody>("/platform/auth/login", {
    method: "POST",
    body: { email: credentials.email, password: credentials.password },
  });
  if (result.status !== 200) {
    return NextResponse.json(
      { message: backendErrorMessage(result.body, "No se pudo iniciar sesión.") },
      { status: result.status },
    );
  }

  await setPlatformCookie(result.body.accessToken, result.body.expiresIn);
  return NextResponse.json({ ok: true });
}
