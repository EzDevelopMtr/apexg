"use client";

import type { ReactNode } from "react";
import { createInMemoryRepositories } from "@apexg/data";
import { RepositoriesProvider } from "@apexg/module-kit";

/**
 * Builds the application's data access on the client.
 *
 * Repositories are class instances, which cannot be serialised across the
 * server/client boundary — so they are constructed here, inside the client
 * bundle, rather than handed down from a server layout.
 *
 * Module scope, not component scope: a new set per render would reset the
 * in-memory stores on every navigation.
 */
const repositories = createInMemoryRepositories();

export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <RepositoriesProvider repositories={repositories}>
      {children}
    </RepositoriesProvider>
  );
}
