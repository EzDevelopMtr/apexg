import { NextResponse } from "next/server";
import { backendErrorMessage, callBackend } from "../../../../lib/backend-client";
import { setSessionCookie } from "../../../../lib/auth-cookie";

/** The one company this deployment serves (see .env.local). */
function companyId(): string {
  const value = process.env.APEXG_COMPANY_ID;
  if (!value) {
    throw new Error("APEXG_COMPANY_ID is not set (see apps/frontend/.env.local).");
  }
  return value;
}

interface LoginRequestBody {
  readonly username?: unknown;
  readonly password?: unknown;
}

interface LoginResponseBody {
  readonly accessToken: string;
  readonly expiresIn: number;
  readonly user: {
    id: string;
    companyId: string;
    roleId: number;
    roleName: string;
    username: string;
    fullName: string;
  };
}

/** Signs in against the real backend and starts the httpOnly session cookie. */
export async function POST(request: Request): Promise<NextResponse> {
  let credentials: LoginRequestBody;
  try {
    credentials = (await request.json()) as LoginRequestBody;
  } catch {
    return NextResponse.json({ message: "Solicitud inválida." }, { status: 400 });
  }

  if (
    typeof credentials.username !== "string" ||
    typeof credentials.password !== "string"
  ) {
    return NextResponse.json(
      { message: "Usuario y contraseña son obligatorios." },
      { status: 400 },
    );
  }

  const result = await callBackend<LoginResponseBody>("/auth/login", {
    method: "POST",
    body: {
      companyId: companyId(),
      username: credentials.username,
      password: credentials.password,
    },
  });

  if (result.status !== 200) {
    return NextResponse.json(
      { message: backendErrorMessage(result.body, "No se pudo iniciar sesión.") },
      { status: result.status },
    );
  }

  await setSessionCookie(result.body.accessToken, result.body.expiresIn);

  return NextResponse.json({ user: result.body.user });
}
