import type { Metadata } from "next";
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { FALLBACK_BRAND } from "../lib/current-brand";
import { isThemeId, THEME_COOKIE } from "../lib/theme-id";
import "./globals.css";

/**
 * No gym of its own: each gym's pages are named and branded by
 * `app/[gym]/layout.tsx`, from their address — never from a cookie, which
 * every tab shares.
 */
export const metadata: Metadata = {
  title: { template: `%s | ${FALLBACK_BRAND.name}`, default: FALLBACK_BRAND.name },
  description: "Sistema de gestión para gimnasio",
  icons: { icon: "/favicon.svg" },
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  // The theme, unlike the brand, is the person's and not the gym's: one
  // cookie for the whole browser. Read here so the first paint is right.
  const saved = (await cookies()).get(THEME_COOKIE)?.value;
  return (
    <html lang="es" data-theme={isThemeId(saved) ? saved : "dark"}>
      <body>{children}</body>
    </html>
  );
}
