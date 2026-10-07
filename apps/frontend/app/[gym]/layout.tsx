import type { Metadata } from "next";
import type { ReactNode } from "react";
import { BrandScope } from "@apexg/ui";
import { brandOf, FALLBACK_BRAND, logoUrl } from "../../lib/current-brand";
import { findCompanyProfile } from "../../lib/company-profile";
import { SessionProvider } from "../../lib/session";

interface GymLayoutProps {
  readonly children: ReactNode;
  readonly params: Promise<{ gym: string }>;
}

/** Every page title ends in the name of the gym in the address: "Clientes | Smart Fit". */
export async function generateMetadata({ params }: Omit<GymLayoutProps, "children">): Promise<Metadata> {
  const profile = await findCompanyProfile((await params).gym);
  if (!profile) return {};
  return {
    title: { template: `%s | ${profile.name}`, absolute: profile.name },
    ...(profile.hasLogo ? { icons: { icon: logoUrl(profile.slug) } } : {}),
  };
}

/**
 * Everything under `/<gym>` — its entrance and its app — wears that gym's
 * brand and holds that gym's session. Both follow the address, so two gyms
 * open in two tabs stay two gyms.
 */
export default async function GymLayout({ children, params }: GymLayoutProps) {
  const { gym } = await params;
  const profile = await findCompanyProfile(gym);
  return (
    <BrandScope brand={profile ? brandOf(profile) : FALLBACK_BRAND}>
      <SessionProvider gym={gym}>{children}</SessionProvider>
    </BrandScope>
  );
}
