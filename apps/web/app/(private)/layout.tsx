import type { ReactNode } from "react";
import SessionGuard from "../../components/session-guard";

export default function PrivateLayout({ children }: { children: ReactNode }) {
  return <SessionGuard>{children}</SessionGuard>;
}
