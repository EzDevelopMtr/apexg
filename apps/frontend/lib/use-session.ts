"use client";

import { useContext } from "react";
import type { SessionContextValue } from "./session-context";
import { SessionContext } from "./session-context";

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (!value) {
    throw new Error("useSession must be used inside <SessionProvider>");
  }
  return value;
}
