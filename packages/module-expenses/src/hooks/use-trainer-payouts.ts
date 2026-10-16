"use client";

import { useCallback } from "react";
import type { Commission, CommissionPayout, Trainer, TrainerId } from "@apexg/core";
import { forbiddenAsEmpty, useCollection, useRepositories } from "@apexg/module-kit";

/**
 * Lo pagado a entrenadores, para listarlo junto a los egresos.
 *
 * Solo lectura: se paga desde Entrenadores o Finanzas. Aquí se ve porque es
 * plata que salió, igual que un arriendo.
 */
export function useTrainerPayouts() {
  const { trainers } = useRepositories();
  const loadTrainers = useCallback(() => forbiddenAsEmpty(trainers.list()), [trainers]);
  const loadCommissions = useCallback(
    () => forbiddenAsEmpty(trainers.listCommissions()),
    [trainers],
  );
  const trainerList = useCollection<Trainer>(loadTrainers);
  const commissions = useCollection<Commission>(loadCommissions);

  const trainerName = useCallback(
    (id: TrainerId) =>
      trainerList.items.find((trainer) => trainer.id === id)?.fullName ??
      "Entrenador retirado",
    [trainerList.items],
  );

  // Todas las comisiones de un pago comparten el comprobante: basta la primera.
  const receiptUrl = useCallback(
    (payout: CommissionPayout) => {
      const [first] = payout.commissions;
      return first ? trainers.commissionReceiptUrl(first.trainerId, first.id) : "";
    },
    [trainers],
  );

  return { trainers: trainerList, commissions, trainerName, receiptUrl };
}
