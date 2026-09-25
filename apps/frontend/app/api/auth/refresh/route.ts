import { NextResponse } from "next/server";
import {
  backendErrorMessage,
  callBackend,
} from "../../../../lib/backend-client";
import { readSessionCookie, setSessionCookie } from "../../../../lib/auth-cookie";

interface RefreshResponseBody {
  accessToken: string;
  expiresIn: number;
}

/**
 * Cambia la cookie de sesión por una con el reloj puesto a cero.
 *
 * El token dura 15 minutos y no hay refresh token: sin esto, la recepcionista
 * perdía la sesión a mitad de la jornada y la app la mandaba al login sin
 * avisar. El navegador llama aquí cada pocos minutos; el token nuevo lo emite
 * el backend solo si el actual sigue siendo válido.
 */
export async function POST(): Promise<NextResponse> {
  const accessToken = await readSessionCookie();
  if (!accessToken) {
    return NextResponse.json({ message: "No autenticado." }, { status: 401 });
  }

  const result = await callBackend<RefreshResponseBody>("/auth/refresh", {
    method: "POST",
    accessToken,
  });

  if (result.status !== 200) {
    return NextResponse.json(
      { message: backendErrorMessage(result.body, "Sesión inválida.") },
      { status: result.status },
    );
  }

  await setSessionCookie(result.body.accessToken, result.body.expiresIn);
  return NextResponse.json({ expiresIn: result.body.expiresIn });
}
