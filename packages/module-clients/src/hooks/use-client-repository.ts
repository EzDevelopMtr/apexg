"use client";

import { useContext } from "react";
import type { ClientRepository } from "@apexg/data";
import { ClientRepositoryContext } from "../client-repository-context";

export function useClientRepository(): ClientRepository {
  const repository = useContext(ClientRepositoryContext);
  if (!repository) {
    throw new Error(
      "useClientRepository must be used inside <ClientRepositoryProvider>",
    );
  }
  return repository;
}
