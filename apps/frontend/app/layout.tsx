import type { Metadata } from "next";
import type { ReactNode } from "react";
import { FALLBACK_BRAND } from "../lib/current-brand";
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

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
