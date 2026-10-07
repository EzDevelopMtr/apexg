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

const generalTimer = (key: PlatformSettingKey) => `general:${key}`;
const overrideTimer = (key: PlatformSettingKey, companyId: string) => `override:${key}:${companyId}`;

/** One pending timer per id: a new call replaces it, `cancel` drops it. */
function useDebouncedWrites(run: (action: () => Promise<void>) => unknown) {
  const timers = useRef(new Map<string, number>());
  const cancel = (id: string) => {
    window.clearTimeout(timers.current.get(id));
    timers.current.delete(id);
  };
  const later = (id: string, action: () => Promise<void>) => {
    cancel(id);
    timers.current.set(id, window.setTimeout(() => void run(action), SAVE_AFTER_MS));
  };
  return { later, cancel };
}

/**
 * Settings apply as they change — no save button. The screen updates at
 * once; a burst of taps is saved once, when it settles. An immediate write
 * (a switch, removing an exception) first cancels any save still pending for
 * the same value, so a late stepper save can never overwrite it.
 */
export function usePlatformSettings(notify: Notify) {
  const repository = usePlatformRepository();
  const [settings, setSettings] = useState<readonly PlatformSetting[]>([]);
  const [error, setError] = useState<string | null>(null);
  // Read by event handlers (undo, immediate writes) to see the value on screen now.
  const latest = useRef(settings);
  useEffect(() => {
    latest.current = settings;
  }, [settings]);

  const reload = useCallback(async () => {
    try {
      setSettings(await repository.listSettings());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos cargar los ajustes.");
    }
  }, [repository]);

  useEffect(() => {
    void reload();
  }, [reload]);

  /** True when saved. On failure the screen goes back to what the server has, and says why. */
  const persist = useCallback(
    async (action: () => Promise<void>): Promise<boolean> => {
      try {
        await action();
        setError(null);
        return true;
      } catch (cause) {
        await reload();
        setError(cause instanceof Error ? cause.message : "No se pudo guardar el ajuste.");
        return false;
      }
    },
    [reload],
  );

  const { later, cancel } = useDebouncedWrites(persist);

  const patch = (key: PlatformSettingKey, change: (s: PlatformSetting) => PlatformSetting) =>
    setSettings((list) => list.map((s) => (s.key === key ? change(s) : s)));

  const current = (key: PlatformSettingKey) => latest.current.find((s) => s.key === key);

  const setGeneralValue = (setting: PlatformSetting, value: unknown) => {
    const enforced = setting.platform?.enforced ?? false;
    patch(setting.key, (s) => withGeneral(s, value, enforced));
    later(generalTimer(setting.key), () => repository.setGeneral(setting.key, value, enforced));
  };

  /** Writes the value on screen — including one a stepper has not saved yet — with `enforced`. */
  const writeEnforced = async (key: PlatformSettingKey, enforced: boolean): Promise<boolean> => {
    const setting = current(key);
    if (!setting) return false;
    const value = generalValue(setting);
    cancel(generalTimer(key));
    patch(key, (s) => withGeneral(s, value, enforced));
    return persist(() => repository.setGeneral(key, value, enforced));
  };

  const setEnforced = async (setting: PlatformSetting, enforced: boolean, title: string) => {
    if (!(await writeEnforced(setting.key, enforced))) return;
    // Undo flips the switch back and nothing else: a value changed since stays.
    notify(enforced ? `${title}: obligatorio para todos` : `${title}: se respetan las excepciones`, () =>
      writeEnforced(setting.key, !enforced),
    );
  };

  const setOverrideValue = (key: PlatformSettingKey, companyId: string, value: unknown) => {
    patch(key, (s) => withOverride(s, companyId, value));
    later(overrideTimer(key, companyId), () => repository.setOverride(key, companyId, value));
  };

  const addOverride = async (key: PlatformSettingKey, companyId: string, value: unknown, gymName: string) => {
    if (!(await persist(() => repository.setOverride(key, companyId, value)))) return false;
    await reload();
    notify(`Excepción agregada para ${gymName}`);
    return true;
  };

  const removeOverride = async (setting: PlatformSetting, companyId: string) => {
    cancel(overrideTimer(setting.key, companyId));
    const before = current(setting.key)?.overrides.find((o) => o.companyId === companyId)?.value;
    if (!(await persist(() => repository.clearOverride(setting.key, companyId)))) return;
    await reload();
    notify("Excepción quitada", () =>
      persist(() => repository.setOverride(setting.key, companyId, before)).then(reload),
    );
  };

  return { settings, error, setGeneralValue, setEnforced, setOverrideValue, addOverride, removeOverride };
}

export type PlatformSettingsActions = ReturnType<typeof usePlatformSettings>;
