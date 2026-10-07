"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { HttpPlatformRepository } from "@apexg/data";
import { PlatformLinksContext, PlatformPage, PlatformRepositoryContext } from "@apexg/module-platform";
import type { PlatformLinks } from "@apexg/module-platform";
import { logoUrl } from "../lib/brand-urls";

export interface PlatformPanelProps {
  readonly adminName: string;
  readonly adminEmail: string;
  /** Where gyms are reached from outside, e.g. https://x.ts.net */
  readonly publicBaseUrl: string;
}

/** Wires the concrete data source and the app's addresses to the panel (rule 5). */
export default function PlatformPanel({ adminName, adminEmail, publicBaseUrl }: PlatformPanelProps) {
  const router = useRouter();
  const repository = useMemo(() => new HttpPlatformRepository(), []);
  const links = useMemo<PlatformLinks>(
    () => ({ gymLink: (slug) => `${publicBaseUrl}/${slug}`, gymLogo: logoUrl }),
    [publicBaseUrl],
  );

  const signOut = async () => {
    await fetch("/api/platform-session/logout", { method: "POST" }).catch(() => undefined);
    router.replace("/admin/login");
  };

  return (
    <PlatformRepositoryContext.Provider value={repository}>
      <PlatformLinksContext.Provider value={links}>
        <PlatformPage adminName={adminName} adminEmail={adminEmail} onSignOut={() => void signOut()} />
      </PlatformLinksContext.Provider>
    </PlatformRepositoryContext.Provider>
  );
}
