import type { Metadata } from "next";
import type { ReactNode } from "react";
import { BrandScope } from "@apexg/ui";
import { brandOf, FALLBACK_BRAND, logoUrl } from "../../lib/current-brand";
import { findCompanyProfile } from "../../lib/company-profile";

interface GymLayoutProps {
  readonly children: ReactNode;
  readonly params: Promise<{ gym: string }>;
}

/** The entrance wears the brand of the gym in its URL, not the one in the cookie. */
export async function generateMetadata({ params }: Omit<GymLayoutProps, "children">): Promise<Metadata> {
  const profile = await findCompanyProfile((await params).gym);
  return profile?.hasLogo ? { icons: { icon: logoUrl(profile.slug) } } : {};
}

export default async function GymLayout({ children, params }: GymLayoutProps) {
  const profile = await findCompanyProfile((await params).gym);
  return <BrandScope brand={profile ? brandOf(profile) : FALLBACK_BRAND}>{children}</BrandScope>;
}
