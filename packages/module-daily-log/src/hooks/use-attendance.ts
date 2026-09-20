"use client";

import { useCallback, useEffect, useState } from "react";
import type { Attendance, ClientId } from "@apexg/core";
import type { AttendanceCandidate } from "@apexg/data";
import { useCollection, useRepositories } from "@apexg/module-kit";
import type { Collection } from "@apexg/module-kit";

export interface UseAttendanceResult {
  readonly today: Collection<Attendance>;
  readonly matches: readonly AttendanceCandidate[];
  readonly searching: boolean;
  readonly error: string | null;
  readonly search: (query: string) => void;
  readonly checkIn: (clientId: ClientId) => Promise<void>;
  readonly checkOut: (clientId: ClientId) => Promise<void>;
}

/** Below this, a search would return most of the gym. */
const MIN_QUERY = 2;

export function useAttendance(): UseAttendanceResult {
  const { attendances } = useRepositories();

  const load = useCallback(() => attendances.listToday(), [attendances]);
  const today = useCollection<Attendance>(load);
  const { reload } = today;

  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<readonly AttendanceCandidate[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (query.trim().length < MIN_QUERY) return;

    // Debounced and cancellable: the receptionist types faster than the round
    // trip, and without the flag a slow early reply could land after a later
    // one and show results for a query that is no longer on screen.
    let current = true;
    const timer = setTimeout(() => {
      setSearching(true);
      attendances
        .search(query.trim())
        .then((rows) => current && setMatches(rows))
        .catch(() => current && setError("No pudimos buscar clientes."))
        .finally(() => current && setSearching(false));
    }, 250);

    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [query, attendances]);

  const refresh = useCallback(async () => {
    await reload();
    if (query.trim().length >= MIN_QUERY) {
      setMatches(await attendances.search(query.trim()));
    }
  }, [reload, attendances, query]);

  const run = useCallback(
    async (action: Promise<unknown>, failure: string) => {
      setError(null);
      try {
        await action;
        await refresh();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : failure);
      }
    },
    [refresh],
  );

  return {
    today,
    // Derived rather than cleared in the effect: a short query has no results
    // by definition, and emptying it there would be a setState that triggers
    // a second render for something already knowable during the first.
    matches: query.trim().length < MIN_QUERY ? [] : matches,
    searching,
    error,
    search: setQuery,
    checkIn: (clientId) =>
      run(attendances.checkIn(clientId), "No pudimos registrar el ingreso."),
    checkOut: (clientId) =>
      run(attendances.checkOut(clientId), "No pudimos registrar la salida."),
  };
}
