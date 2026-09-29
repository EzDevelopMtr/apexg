"use client";

import { formatCOP } from "@apexg/core";
import { BarList, Card, CardBody, CardHeader } from "@apexg/ui";
import type { FinanceOverview } from "../hooks/use-finance-overview";

/**
 * De dónde viene la plata del periodo y en qué se va.
 *
 * El primero responde qué plan sostiene el negocio —dónde tiene sentido una
 * promoción y qué plan casi nadie compra—; el segundo, qué gasto creció
 * respecto al periodo anterior, que es por donde se empieza a recortar.
 */
export default function BreakdownCards({
  overview,
  rangeLabel,
}: {
  overview: FinanceOverview;
  /** El periodo escrito, "14 – 20 sep 2026". */
  rangeLabel: string;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader
          title="De dónde viene el ingreso"
          description={`${rangeLabel}, por plan, venta de productos y pases de día.`}
        />
        <CardBody>
          <BarList
            label="Ingresos del periodo por origen"
            emptyMessage="No hubo ingresos en este periodo."
            items={overview.income.map((share) => ({
              key: share.key,
              label: share.label,
              value: share.amount,
              valueLabel: formatCOP(share.amount),
            }))}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="En qué se va"
          description={`${rangeLabel}, por categoría, contra el periodo anterior.`}
        />
        <CardBody>
          <BarList
            label="Egresos del periodo por categoría"
            emptyMessage="No hubo egresos en este periodo ni en el anterior."
            items={overview.spending.map((share) => ({
              key: share.key,
              label: share.label,
              value: share.amount,
              valueLabel: formatCOP(share.amount),
              note: `Periodo anterior: ${formatCOP(share.previous ?? share.amount)}`,
            }))}
          />
        </CardBody>
      </Card>
    </div>
  );
}
