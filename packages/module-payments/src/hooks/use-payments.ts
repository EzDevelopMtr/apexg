"use client";

import { useCallback } from "react";
import type { Client, Payment } from "@apexg/core";
import { useCollection, useRepositories } from "@apexg/module-kit";
import type { Collection } from "@apexg/module-kit";

export interface UsePaymentsResult extends Collection<Payment> {
  /** Appends a payment (RF-17). Payments are never rewritten (RNF-07). */
  readonly record: (
    draft: Omit<Payment, "id">,
    receipt?: Blob,
  ) => Promise<Payment>;
}

export function usePayments(): UsePaymentsResult {
  const { payments } = useRepositories();

  const load = useCallback(() => payments.list(), [payments]);
  const collection = useCollection<Payment>(load);
  const { apply } = collection;

  const record = useCallback(
    async (draft: Omit<Payment, "id">, receipt?: Blob) => {
      const saved = await payments.record(draft, receipt);
      apply((current) => [...current, saved]);
      return saved;
    },
    [payments, apply],
  );

  return { ...collection, record };
}

/** The clients a payment can be attached to. */
export function useClientDirectory(): Collection<Client> {
  const { clients } = useRepositories();
  const load = useCallback(() => clients.list(), [clients]);
  return useCollection<Client>(load);
}
