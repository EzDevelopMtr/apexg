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

export interface PlatformLinks {
  /** Where a gym's people sign in: `<public base>/<slug>`. */
  readonly gymLink: (slug: string) => string;
  /** The gym's uploaded logo, served by the web app. */
  readonly gymLogo: (slug: string) => string;
}

/**
 * Addresses only the web app knows: its public base (an env var, or the
 * address the panel was opened on) and the route that relays a logo.
 */
export const PlatformLinksContext = createContext<PlatformLinks>({
  gymLink: (slug) => `/${slug}`,
  gymLogo: (slug) => `/api/brand/${encodeURIComponent(slug)}/logo`,
});

export function usePlatformLinks(): PlatformLinks {
  return useContext(PlatformLinksContext);
}
