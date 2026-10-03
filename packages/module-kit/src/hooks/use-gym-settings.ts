"use client";

// Reading a fetched value after mount is what an effect is for.
// oxlint-disable react/set-state-in-effect

import { useEffect, useState } from "react";
import type { GymSettings } from "@apexg/core";
import { DEFAULT_GYM_SETTINGS } from "@apexg/core";
import type { SettingsRepository } from "@apexg/data";
import { useRepositories } from "./use-repositories";

/** One request per repository set, however many components ask. */
const pending = new WeakMap<SettingsRepository, Promise<GymSettings>>();

/**
 * The settings in force for this gym. Defaults until they arrive — the same
 * values the app used before settings existed, so nothing jumps.
 */
export function useGymSettings(): GymSettings {
  const { settings } = useRepositories();
  const [value, setValue] = useState<GymSettings>(DEFAULT_GYM_SETTINGS);

  useEffect(() => {
    let cancelled = false;
    let request = pending.get(settings);
    if (!request) {
      request = settings.get().catch(() => DEFAULT_GYM_SETTINGS);
      pending.set(settings, request);
    }
    void request.then((loaded) => {
      if (!cancelled) setValue(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, [settings]);

  return value;
}
