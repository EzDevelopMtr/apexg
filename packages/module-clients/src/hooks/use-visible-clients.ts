"use client";

import { useMemo } from "react";
import type { Client, ClientSection, GymSettings, IsoDate } from "@apexg/core";
import { matchesQuery } from "@apexg/core";

export interface ClientFilter {
  readonly query: string;
  readonly referenceDate: IsoDate;
  /** The gym's grace and "por vencer" window: sections that depend on them read them here. */
  readonly settings: GymSettings;
}

/**
 * The clients a list section should show.
 *
 * The section supplies its own predicate, so adding a section never touches
 * this hook — the previous chain of `if (activeSection === ...)` did.
 */
export function useVisibleClients(
  clients: readonly Client[],
  section: ClientSection,
  { query, referenceDate, settings }: ClientFilter,
): readonly Client[] {
  return useMemo(() => {
    if (section.view.kind !== "list") return [];

    const { includes } = section.view;
    return clients.filter(
      (client) =>
        includes(client, referenceDate, settings) && matchesQuery(client, query),
    );
  }, [clients, section, query, referenceDate, settings]);
}
