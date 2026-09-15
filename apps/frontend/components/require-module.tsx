"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { canAccessModule } from "@apexg/core";
import { useSession } from "../lib/use-session";

/**
 * Keeps a role out of a module the permission matrix denies it (RF-02, §2.2).
 *
 * A usability guard, not a security boundary: the server still renders and
 * ships the page, and the stored role is editable from the browser console.
 * RNF-03 needs this enforced server-side once sessions are real.
 */
export default function RequireModule({
  moduleId,
  children,
}: {
  moduleId: string;
  children: ReactNode;
}) {
  const { session, loading } = useSession();
  const router = useRouter();

  const allowed = session ? canAccessModule(session.role, moduleId) : false;

  useEffect(() => {
    if (!loading && session && !allowed) router.replace("/modules");
  }, [loading, session, allowed, router]);

  if (loading || !session || !allowed) return null;

  return <>{children}</>;
}
