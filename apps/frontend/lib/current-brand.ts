import "server-only";
import { cookies } from "next/headers";
import { deriveBrandPalette, isAllowedBrandColor, isHexColor } from "@apexg/core";
import type { Brand } from "@apexg/ui";
import { logoUrl } from "./brand-urls";
import { findCompanyProfile } from "./company-profile";
import type { CompanyProfile } from "./company-profile";
import { GYM_COOKIE_NAME } from "./session-cookie-name";

export { logoUrl };

/** Until a gym is known (the old `/login`, a 404): the product's own name. */
export const FALLBACK_BRAND: Brand = { name: "APEX GYM" };

export function brandOf(profile: CompanyProfile): Brand {
  const color = profile.brandColor;
  // The backend already refuses a status hue; this keeps a bad row from
  // turning the app red rather than trusting it blindly.
  const palette =
    color && isHexColor(color) && isAllowedBrandColor(color)
      ? deriveBrandPalette(color)
      : undefined;
  return {
    name: profile.name,
    ...(profile.hasLogo ? { logoSrc: logoUrl(profile.slug) } : {}),
    ...(palette ? { palette } : {}),
  };
}

/** The gym this browser signed into: private pages are branded by it. */
export async function currentProfile(): Promise<CompanyProfile | undefined> {
  const slug = (await cookies()).get(GYM_COOKIE_NAME)?.value;
  return slug ? findCompanyProfile(slug) : undefined;
}
