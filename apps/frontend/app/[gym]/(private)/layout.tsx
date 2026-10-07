import type { ReactNode } from "react";
import AppProviders from "../../../components/app-providers";
import SessionGuard from "../../../components/session-guard";

interface PrivateLayoutProps {
  readonly children: ReactNode;
  readonly params: Promise<{ gym: string }>;
}

/**
 * Branded and given its session by `app/[gym]/layout.tsx`: both follow the
 * address. Keyed by gym, so another gym never inherits this one's data access.
 */
export default async function PrivateLayout({ children, params }: PrivateLayoutProps) {
  const { gym } = await params;
  return (
    <SessionGuard>
      <AppProviders key={gym}>{children}</AppProviders>
    </SessionGuard>
  );
}
