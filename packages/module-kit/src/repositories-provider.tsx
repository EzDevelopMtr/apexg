"use client";

import type { ReactNode } from "react";
import type { Repositories } from "@apexg/data";
import { RepositoriesContext } from "./repositories-context";

export function RepositoriesProvider({
  repositories,
  children,
}: {
  repositories: Repositories;
  children: ReactNode;
}) {
  return (
    <RepositoriesContext.Provider value={repositories}>
      {children}
    </RepositoriesContext.Provider>
  );
}
