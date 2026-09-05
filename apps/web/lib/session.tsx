"use client";

// Reading a browser-only store after mount is exactly what an effect is for.
// The rule targets derived state, which this is not.
// oxlint-disable react/set-state-in-effect

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Session } from "./session-context";
import { SessionContext } from "./session-context";

/**
 * Browser-side session.
 *
 * THIS IS NOT REAL SECURITY. Credentials are compiled into the bundle and the
 * check runs in the browser, so anyone can read them and anyone can reach a
 * "protected" page's HTML directly.
 *
 * RF-01/RNF-02 require accounts in a database with hashed passwords, and
 * RF-02/RNF-03 require the role check to run on the server. Replacing this
 * means: sign in against the API, store the session in an httpOnly cookie, and
 * guard the routes in `middleware.ts` rather than with a client component.
 */

const DEV_USERNAME = "apexg";
const DEV_PASSWORD = "apex2026";

const STORAGE_KEY = "apexg:session";

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Read after mount, not in a lazy initializer: sessionStorage does not exist
  // during server rendering, and reading it in render would desync hydration.
  useEffect(() => {
    try {
      const stored = window.sessionStorage.getItem(STORAGE_KEY);
      if (stored) setSession(JSON.parse(stored) as Session);
    } catch {
      setSession(null);
    }
    setLoading(false);
  }, []);

  const signIn = useCallback((username: string, password: string) => {
    if (username !== DEV_USERNAME || password !== DEV_PASSWORD) return false;

    const next: Session = { username };
    setSession(next);
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return true;
  }, []);

  const signOut = useCallback(() => {
    setSession(null);
    window.sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo(
    () => ({ session, loading, signIn, signOut }),
    [session, loading, signIn, signOut],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}
