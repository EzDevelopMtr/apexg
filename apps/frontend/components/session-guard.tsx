"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useSession } from "../lib/use-session";

/**
 * Waits for the client's session view to hydrate from the httpOnly cookie
 * (`GET /api/auth/me`) before rendering private children.
 *
 * `proxy.ts` is the real gate now — a signed-out request never reaches
 * this component's page. This just avoids a flash of content before the
 * session (role, name) is known client-side.
 */
export default function SessionGuard({ children }: { children: ReactNode }) {
  const { session, loading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) router.replace("/login");
  }, [loading, session, router]);

  if (loading || !session) return null;

  return <>{children}</>;
}
