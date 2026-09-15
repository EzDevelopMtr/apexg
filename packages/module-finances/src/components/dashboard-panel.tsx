"use client";

import { AlertTriangle, DollarSign, TrendingUp, Users } from "lucide-react";
import type { FinancialRecords, IsoDate } from "@apexg/core";
import { compareWithPreviousMonth, formatCOP } from "@apexg/core";
import KpiCard from "./kpi-card";

/** Key figures for the month (RF-33, RF-35). */
export default function DashboardPanel({
  records,
  on,
}: {
  records: FinancialRecords;
  on: IsoDate;
}) {
  const { current, profitChangePercent } = compareWithPreviousMonth(
    records,
    on,
  );

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        label="Ingresos del mes"
        value={formatCOP(current.income)}
        hint={`${current.range.from} a ${current.range.to}`}
        icon={<DollarSign size={20} />}
      />
      <KpiCard
        label="Utilidad del mes"
        value={formatCOP(current.profit)}
        hint={`${profitChangePercent >= 0 ? "+" : ""}${profitChangePercent}% vs. mes anterior`}
        tone={current.profit >= 0 ? "positive" : "negative"}
        icon={<TrendingUp size={20} />}
      />
      <KpiCard
        label="Clientes activos"
        value={String(current.activeClients)}
        hint="Calculado desde la fecha de vencimiento"
        icon={<Users size={20} />}
      />
      <KpiCard
        label="Clientes en mora"
        value={String(current.overdueClients)}
        tone={current.overdueClients > 0 ? "negative" : "neutral"}
        icon={<AlertTriangle size={20} />}
      />
    </div>
  );
}
