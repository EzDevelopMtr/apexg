"use client";

import { useCallback } from "react";
import type { Client, Expense, FinancialRecords, Payment } from "@apexg/core";
import { useCollection, useRepositories } from "@apexg/module-kit";
import type { Collection, LoadState } from "@apexg/module-kit";

export interface UseFinancialRecordsResult {
  readonly records: FinancialRecords;
  readonly state: LoadState;
  readonly error: string | null;
  readonly reload: () => void;
  /** Exposed so `CollectionGate` can drive the loading and error states. */
  readonly gate: Collection<Payment>;
}

/**
 * Loads the three collections every financial figure needs.
 *
 * They are fetched together because a balance is meaningless with only some of
 * them: income comes from payments, outgoings from expenses, and the client
 * counts are derived, not stored (RF-33).
 */
export function useFinancialRecords(): UseFinancialRecordsResult {
  const { payments, expenses, clients } = useRepositories();

  const loadPayments = useCallback(() => payments.list(), [payments]);
  const loadExpenses = useCallback(() => expenses.list(), [expenses]);
  const loadClients = useCallback(() => clients.list(), [clients]);

  const paymentCollection = useCollection<Payment>(loadPayments);
  const expenseCollection = useCollection<Expense>(loadExpenses);
  const clientCollection = useCollection<Client>(loadClients);

  const parts = [paymentCollection, expenseCollection, clientCollection];
  const state: LoadState = parts.some((part) => part.state === "error")
    ? "error"
    : parts.some((part) => part.state === "loading")
      ? "loading"
      : "ready";

  const reload = useCallback(() => {
    for (const part of parts) part.reload();
    // `parts` is rebuilt each render; the reload functions inside are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    paymentCollection.reload,
    expenseCollection.reload,
    clientCollection.reload,
  ]);

  return {
    records: {
      payments: paymentCollection.items,
      expenses: expenseCollection.items,
      clients: clientCollection.items,
    },
    state,
    error:
      paymentCollection.error ??
      expenseCollection.error ??
      clientCollection.error,
    reload,
    gate: {
      ...paymentCollection,
      state,
      error: paymentCollection.error,
      reload,
    },
  };
}
