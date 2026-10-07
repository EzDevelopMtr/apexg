import "server-only";
import { deriveBrandPalette, isAllowedBrandColor, isHexColor } from "@apexg/core";
import type { Brand } from "@apexg/ui";
import { logoUrl } from "./brand-urls";
import type { CompanyProfile } from "./company-profile";

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

