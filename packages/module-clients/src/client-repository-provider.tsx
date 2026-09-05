"use client";

import type { ReactNode } from "react";
import type { ClientRepository } from "@apexg/data";
import { ClientRepositoryContext } from "./client-repository-context";

export function ClientRepositoryProvider({
  repository,
  children,
}: {
  repository: ClientRepository;
  children: ReactNode;
}) {
  return (
    <ClientRepositoryContext.Provider value={repository}>
      {children}
    </ClientRepositoryContext.Provider>
  );
}
