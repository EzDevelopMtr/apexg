"use client";

import { useCallback, useMemo } from "react";
import type {
  Commission,
  DateRange,
  ExpenseCategory,
  IsoDate,
  MembershipTypeId,
} from "@apexg/core";
import {
  balanceOver,
  expensesByCategory,
  incomeBySource,
  pendingCommissions,
  previousRangeOf,
  profitMargin,
  receivables,
  renewalOutlook,
  totalOf,
  trendGranularity,
  trendOver,
} from "@apexg/core";
import {
  useCollection,
  useMembershipTypeCatalog,
  useRepositories,
} from "@apexg/module-kit";
import { useFinancialRecords } from "./use-financial-records";

/**
 * Todo lo que necesita la vista de Finanzas, ya calculado.
 *
 * Cada cifra sale de `core`; este hook solo junta las colecciones y le pone
 * nombre a los ids (planes, categorías, clientes), que es lo único que la
 * regla no puede saber por sí misma.
 *
 * `range` gobierna lo que ocurrió en un periodo (ingresos, egresos, tendencia).
 * Lo que describe el presente —saldos por cobrar, comisiones sin pagar, quién
 * vence— se calcula siempre a `on`: una deuda no deja de existir porque el
 * filtro mire la semana pasada.
 */
export function useFinanceOverview(on: IsoDate, range: DateRange) {
  const { records, gate } = useFinancialRecords();
  const { expenses, trainers } = useRepositories();
  const plans = useMembershipTypeCatalog();

  const loadCategories = useCallback(() => expenses.listCategories(), [expenses]);
  const categories = useCollection<ExpenseCategory>(loadCategories);
  const loadCommissions = useCallback(() => trainers.listCommissions(), [trainers]);
  const commissions = useCollection<Commission>(loadCommissions);

  return useMemo(() => {
    const previous = previousRangeOf(range);
    const planOf = (id: MembershipTypeId) =>
      plans.items.find((plan) => plan.id === id);
    const clientName = (id: string) =>
      records.clients.find((client) => client.id === id)?.fullName ?? "Cliente";

    const comparison = {
      current: balanceOver(records, range, on),
      previous: balanceOver(records, previous, on),
    };
    const owed = receivables(records.payments);

    return {
      gate,
      comparison,
      margin: profitMargin(comparison.current),
      trend: trendOver(records, range, on),
      granularity: trendGranularity(range),
      income: incomeBySource(records, range, (id) => planOf(id)?.name ?? "Plan retirado"),
      spending: expensesByCategory(
        records.expenses,
        range,
        previous,
        (id) => categories.items.find((one) => one.id === id)?.name ?? "Sin categoría",
      ),
      owed,
      owedTotal: totalOf(owed),
      commissionsDue: pendingCommissions(commissions.items),
      outlook: renewalOutlook(records.clients, (id) => planOf(id)?.price, on),
      clientName,
    };
  }, [records, gate, on, range, plans.items, categories.items, commissions.items]);
}

export type FinanceOverview = ReturnType<typeof useFinanceOverview>;
