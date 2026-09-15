"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { Client, DailyLog, IsoDate, Payment, ProductSale } from "@apexg/core";
import { formatCOP } from "@apexg/core";
import { Card, CardBody, CardHeader } from "@apexg/ui";
import IncomeSourceBreakdown from "./income-source-breakdown";
import type { IncomeSourceRow } from "./income-source-breakdown";

export interface DailyIncomeCardProps {
  log: DailyLog;
  payments: readonly Payment[];
  productSales: readonly ProductSale[];
  clients: readonly Client[];
  on: IsoDate;
}

/**
 * What came in today, and where it came from (RF-34).
 *
 * Collapsed, it shows the total the way it always has. Expanded, it lists
 * every payment and every sale behind that total — a receptionist can see
 * not just "membership payments vs. product sales" but which client paid
 * and which product moved.
 */
export default function DailyIncomeCard({
  log,
  payments,
  productSales,
  clients,
  on,
}: DailyIncomeCardProps) {
  const [expanded, setExpanded] = useState(false);

  const paymentsToday = payments.filter((payment) => payment.paidOn === on);
  const salesToday = productSales.filter((sale) => sale.soldOn === on);
  const count = paymentsToday.length + salesToday.length;

  const paymentRows: readonly IncomeSourceRow[] = paymentsToday.map((payment) => ({
    key: payment.id,
    label:
      clients.find((client) => client.id === payment.clientId)?.fullName ??
      "Cliente",
    amount: payment.amount,
  }));

  const saleRows: readonly IncomeSourceRow[] = salesToday.map((sale) => ({
    key: sale.id,
    label: sale.clientName
      ? `${sale.itemName} × ${sale.quantity} · ${sale.clientName}`
      : `${sale.itemName} × ${sale.quantity}`,
    amount: sale.amount,
  }));

  return (
    <Card>
      <CardHeader title="Ingresos del día" description={on} />
      <CardBody>
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          aria-expanded={expanded}
          className="flex w-full items-center justify-between text-left"
        >
          <div>
            <p className="text-3xl font-bold text-body">{formatCOP(log.income)}</p>
            <p className="mt-1 text-sm text-body-soft">
              {count} {count === 1 ? "movimiento registrado" : "movimientos registrados"}
            </p>
          </div>
          {expanded ? (
            <ChevronUp size={20} className="shrink-0 text-body-soft" />
          ) : (
            <ChevronDown size={20} className="shrink-0 text-body-soft" />
          )}
        </button>

        {expanded && (
          <div className="mt-4 space-y-5 border-t border-line-soft pt-4">
            <IncomeSourceBreakdown
              title={`Pagos de membresía (${paymentsToday.length})`}
              total={log.incomeFromPayments}
              rows={paymentRows}
              emptyMessage="Ninguno hoy."
            />
            <IncomeSourceBreakdown
              title={`Venta de productos (${salesToday.length})`}
              total={log.incomeFromSales}
              rows={saleRows}
              emptyMessage="Ninguna hoy."
            />
          </div>
        )}
      </CardBody>
    </Card>
  );
}
