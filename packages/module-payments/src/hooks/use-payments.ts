"use client";

import { useCallback } from "react";
import type { Client, ClientId, Payment, PaymentId } from "@apexg/core";
import { upsertById, useCollection, useRepositories } from "@apexg/module-kit";
import type { Collection } from "@apexg/module-kit";

export interface UsePaymentsResult extends Collection<Payment> {
  /** Appends a payment (RF-17). Payments are never rewritten (RNF-07). */
  readonly record: (
    draft: Omit<Payment, "id">,
    receipt?: Blob,
  ) => Promise<Payment>;
  /** Address of a payment receipt, built by the data layer. */
  readonly receiptUrl: (paymentId: PaymentId) => string;
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

  const receiptUrl = useCallback(
    (paymentId: PaymentId) => payments.receiptUrl(paymentId),
    [payments],
  );

  return { ...collection, record, receiptUrl };
}

/** The clients a payment can be attached to, plus the way to renew one. */
export function useClientDirectory(): Collection<Client> & {
  readonly renew: (clientId: ClientId) => Promise<void>;
} {
  const { clients } = useRepositories();
  const load = useCallback(() => clients.list(), [clients]);
  const collection = useCollection<Client>(load);
  const { apply } = collection;

  const renew = useCallback(
    async (clientId: ClientId) => {
      const renewed = await clients.renew(clientId);
      apply((current) => upsertById(current, renewed));
    },
    [clients, apply],
  );

  return { ...collection, renew };
}
