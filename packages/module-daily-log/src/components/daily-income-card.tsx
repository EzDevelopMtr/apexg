"use client";

import type { IsoDate, Money, Payment } from "@apexg/core";
import { formatCOP } from "@apexg/core";
import { Card, CardBody, CardHeader } from "@apexg/ui";

/** What came in today (RF-34). */
export default function DailyIncomeCard({
  income,
  payments,
  on,
}: {
  income: Money;
  payments: readonly Payment[];
  on: IsoDate;
}) {
  const count = payments.filter((payment) => payment.paidOn === on).length;

  return (
    <Card>
      <CardHeader title="Ingresos del día" description={on} />
      <CardBody>
        <p className="text-3xl font-bold text-slate-900">{formatCOP(income)}</p>
        <p className="mt-1 text-sm text-slate-500">
          {count} {count === 1 ? "pago registrado" : "pagos registrados"}
        </p>
      </CardBody>
    </Card>
  );
}
