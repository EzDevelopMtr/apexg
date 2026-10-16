"use client";

import { useCallback } from "react";
import type { Trainer } from "@apexg/core";
import {
  forbiddenAsEmpty,
  useCollection,
  useCommissionSettlement,
  useRepositories,
} from "@apexg/module-kit";
import type { FinanceOverview } from "./use-finance-overview";

/**
 * Pagarle a los entrenadores desde Finanzas.
 *
 * Las comisiones salen de los registros financieros y no de una carga aparte:
 * al pagar, refrescarlas actualiza la tabla, la utilidad y los egresos.
 */
export function useCommissionPayouts(overview: FinanceOverview) {
  const { trainers } = useRepositories();
  const load = useCallback(() => forbiddenAsEmpty(trainers.list()), [trainers]);
  const trainerList = useCollection<Trainer>(load);
  const settlement = useCommissionSettlement(
    overview.commissions,
    overview.refreshCommissions,
  );
  return { trainers: trainerList, ...settlement };
}
