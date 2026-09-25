"use client";

import { useCallback } from "react";
import type {
  Client,
  Expense,
  FinancialRecords,
  Payment,
  ProductSale,
  SavingsContribution,
} from "@apexg/core";
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
 * Loads every collection a financial figure needs.
 *
 * They are fetched together because a balance is meaningless with only some of
 * them: income comes from payments, outgoings from expenses, lo apartado a
 * bolsillos baja la utilidad, y los conteos de clientes se derivan, no se
 * leen (RF-33).
 */
export function useFinancialRecords(): UseFinancialRecordsResult {
  const { payments, productSales, expenses, clients, savings } =
    useRepositories();

  const loadPayments = useCallback(() => payments.list(), [payments]);
  const loadSales = useCallback(() => productSales.list(), [productSales]);
  const loadExpenses = useCallback(() => expenses.list(), [expenses]);
  const loadClients = useCallback(() => clients.list(), [clients]);
  const loadSavings = useCallback(
    () => savings.listContributions(),
    [savings],
  );

  const paymentCollection = useCollection<Payment>(loadPayments);
  const saleCollection = useCollection<ProductSale>(loadSales);
  const expenseCollection = useCollection<Expense>(loadExpenses);
  const clientCollection = useCollection<Client>(loadClients);
  const savingsCollection = useCollection<SavingsContribution>(loadSavings);

  const parts = [
    paymentCollection,
    saleCollection,
    expenseCollection,
    clientCollection,
    savingsCollection,
  ];
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
    saleCollection.reload,
    expenseCollection.reload,
    clientCollection.reload,
    savingsCollection.reload,
  ]);

  return {
    records: {
      payments: paymentCollection.items,
      productSales: saleCollection.items,
      expenses: expenseCollection.items,
      clients: clientCollection.items,
      savings: savingsCollection.items,
    },
    state,
    error:
      paymentCollection.error ??
      saleCollection.error ??
      expenseCollection.error ??
      clientCollection.error ??
      savingsCollection.error,
    reload,
    gate: {
      ...paymentCollection,
      state,
      error: paymentCollection.error,
      reload,
    },
  };
}
