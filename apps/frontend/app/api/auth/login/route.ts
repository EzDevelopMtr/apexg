import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { backendErrorMessage, callBackend } from "../../../../lib/backend-client";
import { setSessionCookie } from "../../../../lib/auth-cookie";
import { findCompanyProfile } from "../../../../lib/company-profile";
import { GYM_COOKIE_NAME } from "../../../../lib/session-cookie-name";

/** A year: it only remembers which gym's door to show. */
const GYM_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

interface LoginRequestBody {
  readonly gym?: unknown;
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

/**
 * Signs in against the real backend and starts the httpOnly session cookie.
 * The gym comes as its slug (the page the form sits on); its id is resolved
 * here, server-side.
 */
export async function POST(request: Request): Promise<NextResponse> {
  let credentials: LoginRequestBody;
  try {
    credentials = (await request.json()) as LoginRequestBody;
  } catch {
    return NextResponse.json({ message: "Solicitud inválida." }, { status: 400 });
  }

  if (
    typeof credentials.gym !== "string" ||
    typeof credentials.username !== "string" ||
    typeof credentials.password !== "string"
  ) {
    return NextResponse.json(
      { message: "Usuario y contraseña son obligatorios." },
      { status: 400 },
    );
  }

  const company = await findCompanyProfile(credentials.gym);
  if (!company) {
    return NextResponse.json({ message: "Gimnasio no encontrado." }, { status: 404 });
  }

  const result = await callBackend<LoginResponseBody>("/auth/login", {
    method: "POST",
    body: {
      companyId: company.id,
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
  (await cookies()).set(GYM_COOKIE_NAME, company.slug, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: GYM_COOKIE_MAX_AGE,
  });

  return NextResponse.json({ user: result.body.user });
}
