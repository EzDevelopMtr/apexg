import type { ReactNode } from "react";
import AppProviders from "../../components/app-providers";
import SessionGuard from "../../components/session-guard";

export default function PrivateLayout({ children }: { children: ReactNode }) {
  return (
    <SessionGuard>
      <AppProviders>{children}</AppProviders>
    </SessionGuard>
  );
}
