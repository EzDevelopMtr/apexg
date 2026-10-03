"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { HttpPlatformRepository } from "@apexg/data";
import { CompaniesPage, PlatformRepositoryContext } from "@apexg/module-platform";

/** Wires the concrete data source to the panel (rule 5). */
export default function PlatformPanel({ adminName }: { adminName: string }) {
  const router = useRouter();
  const repository = useMemo(() => new HttpPlatformRepository(), []);

  const signOut = async () => {
    await fetch("/api/platform-session/logout", { method: "POST" }).catch(() => undefined);
    router.replace("/admin/login");
  };

  return (
    <PlatformRepositoryContext.Provider value={repository}>
      <CompaniesPage adminName={adminName} onSignOut={() => void signOut()} />
    </PlatformRepositoryContext.Provider>
  );
}
