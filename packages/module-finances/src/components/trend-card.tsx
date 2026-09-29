"use client";

import { formatCOP, formatCOPCompact } from "@apexg/core";
import type { Money } from "@apexg/core";
import { Card, CardBody, CardHeader, ColumnChart } from "@apexg/ui";
import type { FinanceOverview } from "../hooks/use-finance-overview";

const DESCRIPTION = {
  day: "Por día. Pasa el mouse sobre una barra para ver el detalle y la utilidad.",
  month: "Por mes. Pasa el mouse sobre una barra para ver el detalle y la utilidad.",
} as const;

/**
 * Ingresos contra egresos a lo largo del periodo.
 *
 * Día a día en una semana o un mes, para ver qué días cargan el ingreso; mes
 * a mes en rangos largos, para ver si el gimnasio crece, se estanca o gasta
 * más rápido de lo que entra — lo que decide abrir un horario, subir una
 * tarifa o recortar un gasto.
 */
export default function TrendCard({ overview }: { overview: FinanceOverview }) {

  return (
    <Card>
      <CardHeader
        title="Ingresos y egresos"
        description={DESCRIPTION[overview.granularity]}
      />
      <CardBody>
        <ColumnChart
          label="Ingresos y egresos del periodo"
          series={[{ label: "Ingresos" }, { label: "Egresos" }]}
          formatAxis={(value) => formatCOPCompact(value as Money)}
          groups={overview.trend.map((month) => ({
            key: month.key,
            label: month.label,
            title: month.title,
            current: month.current,
            values: [month.income, month.expenses],
            details: [
              { label: "Ingresos", value: formatCOP(month.income) },
              { label: "Egresos", value: formatCOP(month.expenses) },
              { label: "Apartado a bolsillos", value: formatCOP(month.savings) },
              { label: "Utilidad", value: formatCOP(month.profit) },
            ],
          }))}
        />
      </CardBody>
    </Card>
  );
}
