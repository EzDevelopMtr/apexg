"use client";

import { useCallback } from "react";
import type { Commission, PaymentMethod, TrainerId } from "@apexg/core";
import { unsettledCommissions } from "@apexg/core";
import { useRepositories } from "./use-repositories";

export interface CommissionSettlement {
  /**
   * Marca como pagadas TODAS las comisiones pendientes del entrenador, en un
   * solo pago con un solo comprobante.
   *
   * Por entrenador y no una por una: en el gimnasio al entrenador se le paga
   * lo acumulado de una vez, y liquidar fila por fila era obligar a la
   * recepcionista a hacer diez clics para un solo pago.
   */
  readonly settleAll: (
    trainerId: TrainerId,
    method: PaymentMethod,
    receipt?: Blob,
  ) => Promise<void>;
  /** Where to open the receipt of a settled commission. */
  readonly receiptUrl: (commission: Commission) => string;
}

/**
 * Paying trainers, shared by Entrenadores and Finanzas.
 *
 * `onSettled` reloads whatever the caller shows: in Finanzas a payout is also
 * an outgoing, so the whole balance has to refresh, not just the list.
 */
export function useCommissionSettlement(
  commissions: readonly Commission[],
  onSettled: () => void,
): CommissionSettlement {
  const { trainers } = useRepositories();

  const settleAll = useCallback(
    async (trainerId: TrainerId, method: PaymentMethod, receipt?: Blob) => {
      // Una sola llamada: el backend liquida todas en una transacción, así
      // que no queda un lote a medias si algo falla.
      const ids = unsettledCommissions(commissions, trainerId).map(
        (commission) => commission.id,
      );
      try {
        await trainers.settleCommissions(trainerId, ids, method, receipt);
      } finally {
        onSettled();
      }
    },
    [trainers, commissions, onSettled],
  );

  const receiptUrl = useCallback(
    (commission: Commission) =>
      trainers.commissionReceiptUrl(commission.trainerId, commission.id),
    [trainers],
  );

  return { settleAll, receiptUrl };
}
