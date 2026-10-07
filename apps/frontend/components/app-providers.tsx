"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { createHttpRepositories } from "@apexg/data";
import { RepositoriesProvider } from "@apexg/module-kit";

/**
 * Builds the application's data access on the client.
 *
 * Repositories are class instances, which cannot be serialised across the
 * server/client boundary — so they are constructed here, inside the client
 * bundle, rather than handed down from a server layout.
 *
 * One set per mount, kept across renders: a new set per render would reset
 * client-side state (in-memory repositories still awaiting their HTTP
 * counterpart) on every navigation. Mounted with `key={gym}`
 * (`app/[gym]/(private)/layout.tsx`), so each gym gets its own set — and its
 * own cached settings and module switches.
 */
export default function AppProviders({ children }: { children: ReactNode }) {
  const [repositories] = useState(createHttpRepositories);
  return (
    <RepositoriesProvider repositories={repositories}>
      {children}
    </RepositoriesProvider>
  );
}
