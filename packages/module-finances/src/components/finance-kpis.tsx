"use client";

import { DollarSign, HandCoins, Receipt, TrendingUp } from "lucide-react";
import type { Money } from "@apexg/core";
import { comparableChange, formatCOP } from "@apexg/core";
import type { FinanceOverview } from "../hooks/use-finance-overview";
import KpiCard from "./kpi-card";

function versus(before: Money, after: Money, against: string): string {
  const change = comparableChange(before, after);
  if (change === null) return "Sin movimiento en el periodo anterior";
  return `${change >= 0 ? "+" : ""}${change}% ${against}`;
}

/**
 * Las cuatro cifras con que abre el tablero.
 *
 * Dos miran el resultado del periodo (cuánto entró, cuánto quedó) y dos la plata
 * que todavía no se ha movido: la que falta cobrar y la que falta pagar. Son
 * las que cambian una decisión hoy; un conteo de clientes, por ejemplo, no.
 */
export default function FinanceKpis({
  overview,
  versus: against,
}: {
  overview: FinanceOverview;
  /** Cómo se lee la comparación del periodo: "vs. mes anterior". */
  versus: string;
}) {
  const { current, previous } = overview.comparison;
  const profitVersus = versus(previous.profit, current.profit, against);

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        label="Ingresos"
        value={formatCOP(current.income)}
        hint={versus(previous.income, current.income, against)}
        icon={<DollarSign size={20} />}
      />
      <KpiCard
        label="Utilidad"
        value={formatCOP(current.profit)}
        hint={
          overview.margin === null
            ? profitVersus
            : `Margen ${overview.margin}% · ${profitVersus}`
        }
        tone={current.profit >= 0 ? "positive" : "negative"}
        icon={<TrendingUp size={20} />}
      />
      <KpiCard
        label="Por cobrar"
        value={formatCOP(overview.owedTotal)}
        hint={`${overview.owed.length} ${overview.owed.length === 1 ? "abono sin completar" : "abonos sin completar"}`}
        icon={<Receipt size={20} />}
      />
      <KpiCard
        label="Comisiones por pagar"
        value={formatCOP(overview.commissionsDue)}
        hint="Se pagan desde Entrenadores → Comisiones"
        icon={<HandCoins size={20} />}
      />
    </div>
  );
}
