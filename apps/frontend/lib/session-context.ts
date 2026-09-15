import { createContext } from "react";
import type { Role } from "@apexg/core";

export interface Session {
  readonly id: string;
  readonly companyId: string;
  readonly roleId: number;
  readonly username: string;
  readonly fullName: string;
  readonly role: Role;
}

export type SignInResult = { ok: true } | { ok: false; message: string };

export interface SessionContextValue {
  /** `null` when signed out. */
  readonly session: Session | null;
  /**
   * True while the session is being hydrated from the httpOnly cookie
   * (a `GET /api/auth/me` round trip). Without it the first render would
   * bounce a signed-in user to the login page.
   */
  readonly loading: boolean;
  readonly signIn: (username: string, password: string) => Promise<SignInResult>;
  readonly signOut: () => Promise<void>;
}

export const SessionContext = createContext<SessionContextValue | null>(null);
