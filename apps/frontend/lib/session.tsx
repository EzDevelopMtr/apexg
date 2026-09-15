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
 * `GET /api/auth/me` on mount, and `signIn`/`signOut` go through the
 * `/api/auth/*` Route Handlers, which are the only code allowed to touch
 * the cookie.
 */

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

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    fetch("/api/auth/me")
      .then(async (response) => {
        if (!response.ok) return null;
        const { user } = (await response.json()) as { user: MeUser };
        return toSession(user);
      })
      .catch(() => null)
      .then((next) => {
        if (!cancelled) {
          setSession(next);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Any proxied request coming back 401 (the 15-minute token expired mid
  // session — there is no refresh token yet, RF-01 phase 2) clears the
  // session the same way signOut does. See packages/data/src/http/http-client.ts.
  useEffect(() => {
    const onExpired = () => {
      setSession(null);
      router.replace("/login");
    };
    window.addEventListener("apexg:session-expired", onExpired);
    return () => window.removeEventListener("apexg:session-expired", onExpired);
  }, [router]);

  const signIn = useCallback(async (username: string, password: string): Promise<SignInResult> => {
    const response = await fetch("/api/auth/login", {
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
      return { ok: false, message: "Tu rol no está configurado en la aplicación." };
    }

    setSession(next);
    return { ok: true };
  }, []);

  const signOut = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({ session, loading, signIn, signOut }),
    [session, loading, signIn, signOut],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}
