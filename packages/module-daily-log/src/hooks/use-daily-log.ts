"use client";

import { useCallback } from "react";
import type {
  Client,
  DailyLogNote,
  DayPass,
  IsoDate,
  Payment,
  ProductSale,
} from "@apexg/core";
import { buildDailyLog } from "@apexg/core";
import { useCollection, useRepositories } from "@apexg/module-kit";
import type { Collection, LoadState } from "@apexg/module-kit";

export interface UseDailyLogResult {
  readonly notes: readonly DailyLogNote[];
  readonly payments: readonly Payment[];
  readonly productSales: readonly ProductSale[];
  readonly dayPasses: readonly DayPass[];
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
  const { dailyLog, payments, productSales, dayPasses, clients } =
    useRepositories();

  const loadNotes = useCallback(() => dailyLog.listNotes(), [dailyLog]);
  const loadPayments = useCallback(() => payments.list(), [payments]);
  const loadSales = useCallback(() => productSales.list(), [productSales]);
  const loadPasses = useCallback(() => dayPasses.list(), [dayPasses]);
  const loadClients = useCallback(() => clients.list(), [clients]);

  const noteCollection = useCollection<DailyLogNote>(loadNotes);
  const paymentCollection = useCollection<Payment>(loadPayments);
  const saleCollection = useCollection<ProductSale>(loadSales);
  const passCollection = useCollection<DayPass>(loadPasses);
  const clientCollection = useCollection<Client>(loadClients);
  const { apply } = noteCollection;

  const parts = [
    noteCollection,
    paymentCollection,
    saleCollection,
    passCollection,
    clientCollection,
  ];
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
    productSales: saleCollection.items,
    dayPasses: passCollection.items,
    clients: clientCollection.items,
    state,
    addNote,
    gate: { ...noteCollection, state },
  };
}

export { buildDailyLog };
