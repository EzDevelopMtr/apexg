"use client";

import type { ReactNode } from "react";
import { InMemoryClientRepository } from "@apexg/data";
import { ClientRepositoryProvider } from "@apexg/module-clients";

/**
 * Builds the module's dependencies on the client.
 *
 * The repository is a class instance, which cannot be serialised across the
 * server/client boundary — so it is constructed here, inside the client
 * bundle, rather than handed down from the server layout.
 *
 * Module scope, not component scope: a new instance per render would reset the
 * in-memory store on every navigation.
 */
const clientRepository = new InMemoryClientRepository();

export default function ClientsProviders({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ClientRepositoryProvider repository={clientRepository}>
      {children}
    </ClientRepositoryProvider>
  );
}
