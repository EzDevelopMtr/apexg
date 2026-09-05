"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useSession } from "../lib/use-session";

/**
 * Keeps signed-out visitors out of private pages.
 *
 * This is a usability guard, not a security boundary: the server still renders
 * and ships the page. RF-02/RNF-03 need this enforced in `middleware.ts` once
 * sessions are real.
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
