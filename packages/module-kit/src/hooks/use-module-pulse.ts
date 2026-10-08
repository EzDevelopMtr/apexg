"use client";

// Reading fetched records after mount is what an effect is for.
// oxlint-disable react/set-state-in-effect

import { useEffect, useMemo, useState } from "react";
import type { Client, ModulePulse, PulseRecords } from "@apexg/core";
import { buildModulePulse, today } from "@apexg/core";
import { useGymSettings } from "./use-gym-settings";
import { useRepositories } from "./use-repositories";

export interface UseModulePulseResult {
  /** `null` until the figures arrive. */
  readonly pulse: ModulePulse | null;
  /** Loaded anyway for the figures: the selector's client search reuses them. */
  readonly clients: readonly Client[];
}

/**
 * The live figures of the daily modules, for the selector's cards.
 *
 * A source that fails (a module switched off for this gym answers 403) counts
 * as empty rather than blanking every card: one missing figure should not
 * hide the others.
 */
export function useModulePulse(): UseModulePulseResult {
  const repositories = useRepositories();
  const settings = useGymSettings();
  const [records, setRecords] = useState<PulseRecords | null>(null);

  useEffect(() => {
    let cancelled = false;
    const orEmpty = <T,>(request: Promise<readonly T[]>) => request.catch((): readonly T[] => []);
    void Promise.all([
      orEmpty(repositories.clients.list()),
      orEmpty(repositories.payments.list()),
      orEmpty(repositories.productSales.list()),
      orEmpty(repositories.dayPasses.list()),
      orEmpty(repositories.attendances.listToday()),
    ]).then(([clients, payments, productSales, dayPasses, attendances]) => {
      if (!cancelled) setRecords({ clients, payments, productSales, dayPasses, checkInsToday: attendances.length });
    });
    return () => {
      cancelled = true;
    };
  }, [repositories]);

  const pulse = useMemo(() => (records ? buildModulePulse(records, today(), settings) : null), [records, settings]);
  return { pulse, clients: records?.clients ?? [] };
}
