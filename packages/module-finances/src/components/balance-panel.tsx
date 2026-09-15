"use client";

import type { BalancePeriod, FinancialRecords, IsoDate } from "@apexg/core";
import { calculateBalance, formatCOP } from "@apexg/core";
import { Card, CardBody, CardHeader } from "@apexg/ui";

const PERIODS: readonly { id: BalancePeriod; label: string }[] = [
  { id: "day", label: "Hoy" },
  { id: "week", label: "Esta semana" },
  { id: "month", label: "Este mes" },
];

/** Income against outgoings for the day, week and month (RF-31). */
export default function BalancePanel({
  records,
  on,
}: {
  records: FinancialRecords;
  on: IsoDate;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {PERIODS.map((period) => {
        const balance = calculateBalance(records, period.id, on);

        return (
          <Card key={period.id}>
            <CardHeader
              title={period.label}
              description={`${balance.range.from} a ${balance.range.to}`}
            />
            <CardBody className="space-y-3">
              <Line label="Ingresos" value={formatCOP(balance.income)} />
              <Line label="Egresos" value={formatCOP(balance.expenses)} />
              <div className="border-t border-line-soft pt-3">
                <Line
                  label="Utilidad"
                  value={formatCOP(balance.profit)}
                  tone={balance.profit >= 0 ? "text-ok-ink" : "text-danger-ink"}
                  bold
                />
              </div>
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}

function Line({
  label,
  value,
  tone = "text-body",
  bold = false,
}: {
  label: string;
  value: string;
  tone?: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-body-soft">{label}</span>
      <span className={`${bold ? "font-bold" : "font-medium"} ${tone}`}>
        {value}
      </span>
    </div>
  );
}
