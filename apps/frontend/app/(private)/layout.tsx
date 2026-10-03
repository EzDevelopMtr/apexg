import type { ReactNode } from "react";
import { BrandScope } from "@apexg/ui";
import AppProviders from "../../components/app-providers";
import SessionGuard from "../../components/session-guard";
import { brandOf, currentProfile, FALLBACK_BRAND } from "../../lib/current-brand";

export default async function PrivateLayout({ children }: { children: ReactNode }) {
  const profile = await currentProfile();
  return (
    <BrandScope brand={profile ? brandOf(profile) : FALLBACK_BRAND}>
      <SessionGuard>
        <AppProviders>{children}</AppProviders>
      </SessionGuard>
    </BrandScope>
  );
}
