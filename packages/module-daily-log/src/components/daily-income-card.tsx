"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type {
  Client,
  DailyLog,
  DayPass,
  IsoDate,
  Payment,
  ProductSale,
} from "@apexg/core";
import { formatCOP } from "@apexg/core";
import { Card, CardBody, CardHeader } from "@apexg/ui";
import IncomeSourceBreakdown from "./income-source-breakdown";
import type { IncomeSourceRow } from "./income-source-breakdown";

export interface DailyIncomeCardProps {
  log: DailyLog;
  payments: readonly Payment[];
  productSales: readonly ProductSale[];
  dayPasses: readonly DayPass[];
  clients: readonly Client[];
  on: IsoDate;
}

/**
 * One line per movement of the day, by source.
 *
 * El autor va en la misma línea que el concepto: al cuadrar la caja, la
 * pregunta que sigue a "¿de dónde salió esto?" es "¿quién lo recibió?".
 */
function rowsFor({
  payments,
  productSales,
  dayPasses,
  clients,
  on,
}: Omit<DailyIncomeCardProps, "log">) {
  const nameOf = (id: string) =>
    clients.find((client) => client.id === id)?.fullName ?? "Cliente";

  const paymentRows: readonly IncomeSourceRow[] = payments
    .filter((payment) => payment.paidOn === on)
    .map((payment) => ({
      key: payment.id,
      label: `${nameOf(payment.clientId)} · ${payment.recordedBy}`,
      amount: payment.amount,
    }));

  const saleRows: readonly IncomeSourceRow[] = productSales
    .filter((sale) => sale.soldOn === on)
    .map((sale) => ({
      key: sale.id,
      label: [`${sale.itemName} × ${sale.quantity}`, sale.clientName, sale.recordedBy]
        .filter(Boolean)
        .join(" · "),
      amount: sale.amount,
    }));

  const passRows: readonly IncomeSourceRow[] = dayPasses
    .filter((pass) => pass.soldOn === on)
    .map((pass) => ({
      key: pass.id,
      label: `${pass.visitorName} · ${pass.recordedBy}`,
      amount: pass.amount,
    }));

  return { paymentRows, saleRows, passRows };
}

/**
 * What came in today, and where it came from (RF-34).
 *
 * Collapsed, it shows the total the way it always has. Expanded, it lists
 * every payment, sale and day pass behind that total — a receptionist can
 * see not just where the money came from but which client paid, which
 * product moved and which visitor came in.
 */
export default function DailyIncomeCard({
  log,
  payments,
  productSales,
  dayPasses,
  clients,
  on,
}: DailyIncomeCardProps) {
  const [expanded, setExpanded] = useState(false);

  const { paymentRows, saleRows, passRows } = rowsFor({
    payments,
    productSales,
    dayPasses,
    clients,
    on,
  });
  const count = paymentRows.length + saleRows.length + passRows.length;

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
            <p className="text-3xl font-bold text-body">
              {formatCOP(log.income)}
            </p>
            <p className="mt-1 text-sm text-body-soft">
              {count}{" "}
              {count === 1
                ? "movimiento registrado"
                : "movimientos registrados"}
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
              title={`Pagos de membresía (${paymentRows.length})`}
              total={log.incomeFromPayments}
              rows={paymentRows}
              emptyMessage="Ninguno hoy."
            />
            <IncomeSourceBreakdown
              title={`Venta de productos (${saleRows.length})`}
              total={log.incomeFromSales}
              rows={saleRows}
              emptyMessage="Ninguna hoy."
            />
            <IncomeSourceBreakdown
              title={`Pases de día (${passRows.length})`}
              total={log.incomeFromDayPasses}
              rows={passRows}
              emptyMessage="Ninguno hoy."
            />
          </div>
        )}
      </CardBody>
    </Card>
  );
}
