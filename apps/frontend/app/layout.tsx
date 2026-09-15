import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SessionProvider } from "../lib/session";
import "./globals.css";

export const metadata: Metadata = {
  title: "APEX GYM",
  description: "Sistema de gestión para gimnasio",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
