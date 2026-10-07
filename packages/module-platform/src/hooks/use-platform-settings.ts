"use client";

// Fetching on mount is a legitimate effect.
// oxlint-disable react/set-state-in-effect

import { useCallback, useEffect, useRef, useState } from "react";
import type { PlatformSetting, PlatformSettingKey } from "@apexg/core";
import { usePlatformRepository } from "../platform-context";
import type { Notify } from "./use-toast";

/** The value every gym gets unless it has an exception. */
export const generalValue = (setting: PlatformSetting): unknown => setting.platform?.value ?? setting.defaultValue;

function withGeneral(setting: PlatformSetting, value: unknown, enforced: boolean): PlatformSetting {
  return { ...setting, platform: { value, enforced } };
}

function withOverride(setting: PlatformSetting, companyId: string, value: unknown): PlatformSetting {
  return {
    ...setting,
    overrides: setting.overrides.map((o) => (o.companyId === companyId ? { ...o, value } : o)),
  };
}

/** How long a run of stepper taps waits before it is saved: the screen updates at once. */
const SAVE_AFTER_MS = 450;

/**
 * Settings apply as they change — no save button. The screen updates at
 * once; a burst of taps is saved once, when it settles.
 */
export function usePlatformSettings(notify: Notify) {
  const repository = usePlatformRepository();
  const [settings, setSettings] = useState<readonly PlatformSetting[]>([]);
  const [error, setError] = useState<string | null>(null);
  const timers = useRef(new Map<string, number>());

  const reload = useCallback(async () => {
    try {
      setSettings(await repository.listSettings());
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos cargar los ajustes.");
    }
  }, [repository]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const persist = useCallback(
    async (action: () => Promise<void>) => {
      try {
        await action();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "No se pudo guardar el ajuste.");
        await reload();
      }
    },
    [reload],
  );

  const later = (id: string, action: () => Promise<void>) => {
    window.clearTimeout(timers.current.get(id));
    timers.current.set(id, window.setTimeout(() => void persist(action), SAVE_AFTER_MS));
  };

  const patch = (key: PlatformSettingKey, change: (s: PlatformSetting) => PlatformSetting) =>
    setSettings((list) => list.map((s) => (s.key === key ? change(s) : s)));

  const setGeneralValue = (setting: PlatformSetting, value: unknown) => {
    const enforced = setting.platform?.enforced ?? false;
    patch(setting.key, (s) => withGeneral(s, value, enforced));
    later(`general:${setting.key}`, () => repository.setGeneral(setting.key, value, enforced));
  };

  const setEnforced = async (setting: PlatformSetting, enforced: boolean, title: string) => {
    const value = generalValue(setting);
    patch(setting.key, (s) => withGeneral(s, value, enforced));
    await persist(() => repository.setGeneral(setting.key, value, enforced));
    notify(enforced ? `${title}: obligatorio para todos` : `${title}: se respetan las excepciones`, () =>
      persist(() => repository.setGeneral(setting.key, value, !enforced)).then(reload),
    );
  };

  const setOverrideValue = (key: PlatformSettingKey, companyId: string, value: unknown) => {
    patch(key, (s) => withOverride(s, companyId, value));
    later(`override:${key}:${companyId}`, () => repository.setOverride(key, companyId, value));
  };

  const addOverride = async (key: PlatformSettingKey, companyId: string, value: unknown, gymName: string) => {
    await persist(() => repository.setOverride(key, companyId, value));
    await reload();
    notify(`Excepción agregada para ${gymName}`);
  };

  const removeOverride = async (setting: PlatformSetting, companyId: string) => {
    const before = setting.overrides.find((o) => o.companyId === companyId)?.value;
    await persist(() => repository.clearOverride(setting.key, companyId));
    await reload();
    notify("Excepción quitada", () =>
      persist(() => repository.setOverride(setting.key, companyId, before)).then(reload),
    );
  };

  return { settings, error, setGeneralValue, setEnforced, setOverrideValue, addOverride, removeOverride };
}

export type PlatformSettingsActions = ReturnType<typeof usePlatformSettings>;
