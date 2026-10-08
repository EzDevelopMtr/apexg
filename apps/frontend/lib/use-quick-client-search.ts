"use client";

import { useMemo, useState } from "react";
import type { Client } from "@apexg/core";
import { matchesQuery } from "@apexg/core";

/** Enough to pick from without scrolling a dropdown. */
const MAX_MATCHES = 6;

/**
 * The selector's client search: the same matching rule as the clients list,
 * so a name found here is found there too.
 */
export function useQuickClientSearch(clients: readonly Client[]) {
  const [query, setQuery] = useState("");
  const matches = useMemo(
    () => (query.trim() ? clients.filter((client) => matchesQuery(client, query)).slice(0, MAX_MATCHES) : []),
    [clients, query],
  );
  return { query, setQuery, matches };
}
