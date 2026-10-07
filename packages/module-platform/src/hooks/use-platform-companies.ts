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
  readonly reload: () => void;
  /** Bumps on every logo upload: appended to logo URLs so the new one shows at once. */
  readonly logoVersion: number;
}

/** Every write reloads the list: counts and status come from the server. */
export function usePlatformCompanies(): UsePlatformCompaniesResult {
  const repository = usePlatformRepository();
  const [companies, setCompanies] = useState<readonly PlatformCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logoVersion, setLogoVersion] = useState(0);

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
    uploadLogo: after(async (id: string, logo: Blob) => {
      await repository.uploadLogo(id, logo);
      setLogoVersion((version) => version + 1);
    }),
    reload: () => void reload(),
    logoVersion,
  };
}
