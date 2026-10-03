"use client";

import { createContext, useContext } from "react";
import type { PlatformRepository } from "@apexg/data";

/**
 * The panel receives its data source from the web app (rule 5: depend on
 * abstractions) — the same way business modules get theirs from module-kit.
 */
export const PlatformRepositoryContext =
  createContext<PlatformRepository | null>(null);

export function usePlatformRepository(): PlatformRepository {
  const repository = useContext(PlatformRepositoryContext);
  if (!repository) {
    throw new Error(
      "usePlatformRepository needs a PlatformRepositoryContext provider.",
    );
  }
  return repository;
}
