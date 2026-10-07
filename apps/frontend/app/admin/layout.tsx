import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * The panel is the platform's, not a gym's: its own icon and titles, never
 * the brand of the gym last opened in this browser (the root layout's).
 */
export const metadata: Metadata = {
  title: { absolute: "Panel de plataforma" },
  icons: { icon: "/platform.svg" },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return children;
}
