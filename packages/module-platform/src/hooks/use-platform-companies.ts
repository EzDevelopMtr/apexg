"use client";

// Fetching on mount is a legitimate effect.
// oxlint-disable react/set-state-in-effect

import { useCallback, useEffect, useState } from "react";
import type {
  CompanyChange,
  IssuedCredential,
  NewCompany,
  PlatformCompany,
} from "@apexg/core";
import { usePlatformRepository } from "../platform-context";

export interface UsePlatformCompaniesResult {
  readonly companies: readonly PlatformCompany[];
  readonly loading: boolean;
  readonly error: string | null;
  readonly create: (company: NewCompany) => Promise<IssuedCredential>;
  readonly update: (id: string, change: CompanyChange) => Promise<void>;
  readonly uploadLogo: (id: string, logo: Blob) => Promise<void>;
  readonly resetPassword: (id: string) => Promise<IssuedCredential>;
}

/** Every write reloads the list: counts and status come from the server. */
export function usePlatformCompanies(): UsePlatformCompaniesResult {
  const repository = usePlatformRepository();
  const [companies, setCompanies] = useState<readonly PlatformCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setCompanies(await repository.list());
      setError(null);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No pudimos cargar los gimnasios.",
      );
    } finally {
      setLoading(false);
    }
  }, [repository]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const after = useCallback(
    <A extends unknown[], R>(write: (...args: A) => Promise<R>) =>
      async (...args: A): Promise<R> => {
        const result = await write(...args);
        await reload();
        return result;
      },
    [reload],
  );

  return {
    companies,
    loading,
    error,
    create: after((company: NewCompany) => repository.create(company)),
    update: after((id: string, change: CompanyChange) =>
      repository.update(id, change),
    ),
    uploadLogo: after((id: string, logo: Blob) =>
      repository.uploadLogo(id, logo),
    ),
    resetPassword: after((id: string) =>
      repository.resetAdministratorPassword(id),
    ),
  };
}
