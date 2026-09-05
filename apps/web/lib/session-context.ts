import { createContext } from "react";
import type { Role } from "@apexg/core";

export interface Session {
  readonly username: string;
  readonly role: Role;
}

export interface SessionContextValue {
  /** `null` when signed out. */
  readonly session: Session | null;
  /**
   * True while the stored session is being read. Without it the first render
   * would bounce a signed-in user to the login page.
   */
  readonly loading: boolean;
  /** Returns false when the credentials do not match. */
  readonly signIn: (username: string, password: string) => boolean;
  readonly signOut: () => void;
}

export const SessionContext = createContext<SessionContextValue | null>(null);
