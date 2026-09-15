"use client";

import { useCallback } from "react";
import type { Client, DailyLogNote, IsoDate, Payment } from "@apexg/core";
import { buildDailyLog } from "@apexg/core";
import { useCollection, useRepositories } from "@apexg/module-kit";
import type { Collection, LoadState } from "@apexg/module-kit";

export interface UseDailyLogResult {
  readonly notes: readonly DailyLogNote[];
  readonly payments: readonly Payment[];
  readonly clients: readonly Client[];
  readonly state: LoadState;
  readonly addNote: (
    text: string,
    recordedBy: string,
    on: IsoDate,
  ) => Promise<void>;
  readonly gate: Collection<DailyLogNote>;
}

/** Everything the day's logbook shows (RF-34). */
export function useDailyLog(): UseDailyLogResult {
  const { dailyLog, payments, clients } = useRepositories();

  const loadNotes = useCallback(() => dailyLog.listNotes(), [dailyLog]);
  const loadPayments = useCallback(() => payments.list(), [payments]);
  const loadClients = useCallback(() => clients.list(), [clients]);

  const noteCollection = useCollection<DailyLogNote>(loadNotes);
  const paymentCollection = useCollection<Payment>(loadPayments);
  const clientCollection = useCollection<Client>(loadClients);
  const { apply } = noteCollection;

  const parts = [noteCollection, paymentCollection, clientCollection];
  const state: LoadState = parts.some((part) => part.state === "error")
    ? "error"
    : parts.some((part) => part.state === "loading")
      ? "loading"
      : "ready";

  const addNote = useCallback(
    async (text: string, recordedBy: string, on: IsoDate) => {
      const saved = await dailyLog.addNote({ on, text, recordedBy });
      apply((current) => [...current, saved]);
    },
    [dailyLog, apply],
  );

  return {
    notes: noteCollection.items,
    payments: paymentCollection.items,
    clients: clientCollection.items,
    state,
    addNote,
    gate: { ...noteCollection, state },
  };
}

export { buildDailyLog };
