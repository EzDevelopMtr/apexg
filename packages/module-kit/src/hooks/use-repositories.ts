"use client";

import { useContext } from "react";
import type { Repositories } from "@apexg/data";
import { RepositoriesContext } from "../repositories-context";

export function useRepositories(): Repositories {
  const repositories = useContext(RepositoriesContext);
  if (!repositories) {
    throw new Error(
      "useRepositories must be used inside <RepositoriesProvider>",
    );
  }
  return repositories;
}
