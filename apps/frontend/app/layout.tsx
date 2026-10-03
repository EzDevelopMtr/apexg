import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SessionProvider } from "../lib/session";
import { currentProfile, FALLBACK_BRAND, logoUrl } from "../lib/current-brand";
import "./globals.css";

/** Every page title ends in the gym's name: "Clientes | APEX GYM". */
export async function generateMetadata(): Promise<Metadata> {
  const profile = await currentProfile();
  const name = profile?.name ?? FALLBACK_BRAND.name;
  return {
    title: { template: `%s | ${name}`, default: name },
    description: "Sistema de gestión para gimnasio",
    icons: { icon: profile?.hasLogo ? logoUrl(profile.slug) : "/favicon.svg" },
  };
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
