"use client";

import { useMemo } from "react";
import type { Client, ClientSection, IsoDate } from "@apexg/core";
import { matchesQuery } from "@apexg/core";

/**
 * The clients a list section should show.
 *
 * The section supplies its own predicate, so adding a section never touches
 * this hook — the previous chain of `if (activeSection === ...)` did.
 */
export function useVisibleClients(
  clients: readonly Client[],
  section: ClientSection,
  query: string,
  referenceDate: IsoDate,
): readonly Client[] {
  return useMemo(() => {
    if (section.view.kind !== "list") return [];

    const { includes } = section.view;
    return clients.filter(
      (client) =>
        includes(client, referenceDate) && matchesQuery(client, query),
    );
  }, [clients, section, query, referenceDate]);
}
