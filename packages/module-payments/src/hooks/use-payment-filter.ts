"use client";

import { useCallback, useMemo, useState } from "react";
import type { Client, LedgerEntry, PaymentFilter } from "@apexg/core";
import {
  EMPTY_PAYMENT_FILTER,
  filterPayments,
  isPaymentFilterActive,
  paymentAuthors,
  paymentsTotal,
} from "@apexg/core";
import { entryNameOf } from "../components/client-name";

/**
 * Los filtros de la tabla de pagos y lo que dejan ver.
 *
 * El estado vive aquí y la regla en `core` (`filterPayments`): el componente
 * solo pinta los controles y la tabla.
 */
export function usePaymentFilter(
  payments: readonly LedgerEntry[],
  clients: readonly Client[],
) {
  const [filter, setFilter] = useState<PaymentFilter>(EMPTY_PAYMENT_FILTER);

  const setField = useCallback(
    <K extends keyof PaymentFilter>(field: K, value: PaymentFilter[K]) =>
      setFilter((current) => ({ ...current, [field]: value })),
    [],
  );

  const reset = useCallback(() => setFilter(EMPTY_PAYMENT_FILTER), []);

  const visible = useMemo(
    () =>
      filterPayments(payments, filter, (entry) =>
        entryNameOf(clients, entry),
      ),
    [payments, clients, filter],
  );

  return {
    filter,
    setField,
    reset,
    visible,
    active: isPaymentFilterActive(filter),
    total: paymentsTotal(visible),
    // De todos los pagos, no de los filtrados: si no, elegir un autor dejaría
    // en el selector solo a ese, y no habría cómo cambiar a otro.
    authors: paymentAuthors(payments),
  };
}

export type UsePaymentFilterResult = ReturnType<typeof usePaymentFilter>;
