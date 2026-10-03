"use client";

// Fetching on mount is a legitimate effect.
// oxlint-disable react/set-state-in-effect

import { useCallback, useEffect, useState } from "react";
import type { PlatformSetting, PlatformSettingKey } from "@apexg/core";
import { usePlatformRepository } from "../platform-context";

/** Every write reloads: what each gym ends up with is resolved on the server. */
export function usePlatformSettings() {
  const repository = usePlatformRepository();
  const [settings, setSettings] = useState<readonly PlatformSetting[]>([]);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setSettings(await repository.listSettings());
      setError(null);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No pudimos cargar los ajustes.",
      );
    }
  }, [repository]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const write = useCallback(
    async (action: () => Promise<void>) => {
      try {
        await action();
        await reload();
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "No se pudo guardar el ajuste.",
        );
      }
    },
    [reload],
  );

  return {
    settings,
    error,
    setGeneral: (key: PlatformSettingKey, value: unknown, enforced: boolean) =>
      write(() => repository.setGeneral(key, value, enforced)),
    clearGeneral: (key: PlatformSettingKey) =>
      write(() => repository.clearGeneral(key)),
    setOverride: (key: PlatformSettingKey, companyId: string, value: unknown) =>
      write(() => repository.setOverride(key, companyId, value)),
    clearOverride: (key: PlatformSettingKey, companyId: string) =>
      write(() => repository.clearOverride(key, companyId)),
  };
}

export type PlatformSettingsActions = ReturnType<typeof usePlatformSettings>;
