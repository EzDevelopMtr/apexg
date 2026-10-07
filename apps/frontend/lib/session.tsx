"use client";

// Reading a browser-only fetch result after mount is exactly what an effect
// is for. The rule targets derived state, which this is not.
// oxlint-disable react/set-state-in-effect

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { roleFromName } from "@apexg/core";
import type { Session, SignInResult } from "./session-context";
import { SessionContext } from "./session-context";

/**
 * Browser-side view of the real session.
 *
 * The access token itself lives ONLY in an httpOnly cookie (see
 * `lib/auth-cookie.ts`) — this component never sees it. It hydrates from
 * `GET /<gym>/api/auth/me` on mount, and `signIn`/`signOut` go through the
 * `/<gym>/api/auth/*` Route Handlers, which are the only code allowed to touch
 * the cookie.
 */

/** Diez minutos, contra un token de quince: margen para un reintento. */
const RENEWAL_INTERVAL_MS = 10 * 60 * 1000;

interface MeUser {
  id: string;
  companyId: string;
  roleId: number;
  roleName: string;
  username: string;
  fullName: string;
}

/**
 * `roleFromName` returns `undefined` for a role outside the seeded two
 * (SRS §2.2 has no others yet) — treated as no usable session rather than
 * guessing which modules it may open.
 */
function toSession(user: MeUser): Session | null {
  const role = roleFromName(user.roleName);
  if (!role) {
    return null;
  }
  return {
    id: user.id,
    companyId: user.companyId,
    roleId: user.roleId,
    username: user.username,
    fullName: user.fullName,
    role,
  };
}

/** Drops this gym's cookie server-side; nothing else signs anyone out. */
function clearCookie(gym: string): Promise<unknown> {
  return fetch(`/${gym}/api/auth/logout`, { method: "POST" }).catch(() => undefined);
}

/**
 * This gym's session behind its cookie, or `null`. A valid token whose role
 * the app does not know is no session either — and its cookie goes, or the
 * entrance would keep sending it back here.
 */
async function loadSession(gym: string): Promise<Session | null> {
  try {
    const response = await fetch(`/${gym}/api/auth/me`);
    if (!response.ok) return null;
    const { user } = (await response.json()) as { user: MeUser };
    const session = toSession(user);
    if (!session) await clearCookie(gym);
    return session;
  } catch {
    return null;
  }
}

/**
 * One per gym address (`app/[gym]/layout.tsx`): every call goes to that
 * gym's own `/<gym>/api/auth/*`, so a tab only ever holds the session of the
 * gym it shows — another gym signed in in another tab is another session.
 */
export function SessionProvider({ gym, children }: { gym: string; children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    void loadSession(gym).then((next) => {
      if (!cancelled) {
        setSession(next);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [gym]);

  // El token dura 15 minutos y no hay refresh token, así que una jornada de
  // recepción se quedaba sin sesión a mitad de un cobro: bastaba con que una
  // petición cayera pasados los 15 minutos. Mientras la pestaña esté abierta
  // se cambia por uno nuevo cada 10, con holgura para que un reloj desfasado
  // o una petición lenta no se coman el margen.
  useEffect(() => {
    if (!session) return;

    const renew = () => {
      fetch(`/${gym}/api/auth/refresh`, { method: "POST" }).catch(() => undefined);
    };
    const timer = setInterval(renew, RENEWAL_INTERVAL_MS);

    // Volver a una pestaña que estuvo en segundo plano: el navegador frena
    // los temporizadores de las pestañas ocultas, así que al volver el token
    // puede estar más viejo de lo que este intervalo supone.
    const onVisible = () => {
      if (document.visibilityState === "visible") renew();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [session, gym]);

  // Any proxied request coming back 401 (the token expired despite the
  // renewal above — a suspended laptop, say) clears the session the same way
  // signOut does. See packages/data/src/http/http-client.ts.
  useEffect(() => {
    const onExpired = () => {
      setSession(null);
      void clearCookie(gym).then(() => router.replace(`/${gym}`));
    };
    window.addEventListener("apexg:session-expired", onExpired);
    return () => window.removeEventListener("apexg:session-expired", onExpired);
  }, [router, gym]);

  const signIn = useCallback(async (username: string, password: string): Promise<SignInResult> => {
    const response = await fetch(`/${gym}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const payload = (await response.json().catch(() => null)) as
      | { user: MeUser }
      | { message: string }
      | null;

    if (!response.ok || !payload || !("user" in payload)) {
      const message =
        payload && "message" in payload ? payload.message : "No se pudo iniciar sesión.";
      return { ok: false, message };
    }

    const next = toSession(payload.user);
    if (!next) {
      await clearCookie(gym);
      return { ok: false, message: "Tu rol no está configurado en la aplicación." };
    }

    setSession(next);
    return { ok: true };
  }, [gym]);

  const signOut = useCallback(async () => {
    await clearCookie(gym);
    setSession(null);
  }, [gym]);

  const value = useMemo(
    () => ({ session, loading, signIn, signOut }),
    [session, loading, signIn, signOut],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}
