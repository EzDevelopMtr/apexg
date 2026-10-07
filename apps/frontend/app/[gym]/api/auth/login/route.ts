import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { backendErrorMessage, callBackend } from "../../../../../lib/backend-client";
import { setSessionCookie } from "../../../../../lib/auth-cookie";
import { findCompanyProfile } from "../../../../../lib/company-profile";
import { GYM_COOKIE_NAME } from "../../../../../lib/session-cookie-name";

/** A year: it only remembers which gym's door to show. */
const GYM_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

type RouteContext = { params: Promise<{ gym: string }> };

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

/**
 * Signs into the gym in the address (`/<gym>/api/auth/login`), never one named
 * in the body: its id is resolved here, server-side, and the session cookie
 * is scoped to that gym's path.
 */
export async function POST(request: Request, context: RouteContext): Promise<NextResponse> {
  const { gym } = await context.params;
  let credentials: LoginRequestBody;
  try {
    credentials = (await request.json()) as LoginRequestBody;
  } catch {
    return NextResponse.json({ message: "Solicitud inválida." }, { status: 400 });
  }

  if (typeof credentials.username !== "string" || typeof credentials.password !== "string") {
    return NextResponse.json({ message: "Usuario y contraseña son obligatorios." }, { status: 400 });
  }

  const company = await findCompanyProfile(gym);
  if (!company) {
    return NextResponse.json({ message: "Gimnasio no encontrado." }, { status: 404 });
  }

  const result = await callBackend<LoginResponseBody>("/auth/login", {
    method: "POST",
    body: { companyId: company.id, username: credentials.username, password: credentials.password },
  });

  if (result.status !== 200) {
    return NextResponse.json(
      { message: backendErrorMessage(result.body, "No se pudo iniciar sesión.") },
      { status: result.status },
    );
  }

  await setSessionCookie(company.slug, result.body.accessToken, result.body.expiresIn);
  (await cookies()).set(GYM_COOKIE_NAME, company.slug, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: GYM_COOKIE_MAX_AGE,
  });

  return NextResponse.json({ user: result.body.user });
}
