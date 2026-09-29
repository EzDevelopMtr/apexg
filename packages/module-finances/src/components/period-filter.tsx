"use client";

import { CalendarDays } from "lucide-react";
import { FilterBar, Input, filterChipClasses } from "@apexg/ui";
import type { UseFinancePeriodResult } from "../hooks/use-finance-period";

/**
 * Qué periodo se está mirando, arriba de todo lo que depende de él.
 *
 * El rango resuelto va escrito ("14 – 20 sep 2026"): "Semana pasada" dice
 * poco si no se sabe qué semana es, y es lo que se copia a un informe.
 */
export default function PeriodFilter({ period }: { period: UseFinancePeriodResult }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterBar label="Periodo">
          {period.periods.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={period.period.id === option.id}
              className={filterChipClasses(period.period.id === option.id)}
              onClick={() => period.select(option.id)}
            >
              {option.label}
            </button>
          ))}
        </FilterBar>
        <p className="flex items-center gap-2 text-sm font-medium text-body">
          <CalendarDays size={16} className="text-body-soft" />
          {period.rangeLabel}
        </p>
      </div>

      {period.period.id === "custom" && (
        <div className="flex flex-wrap items-start gap-4">
          <Input
            id="periodFrom"
            label="Desde"
            type="date"
            value={period.custom.from}
            max={period.custom.to || undefined}
            onChange={(event) => period.setCustomDate("from", event.target.value)}
          />
          <Input
            id="periodTo"
            label="Hasta"
            type="date"
            value={period.custom.to}
            min={period.custom.from || undefined}
            onChange={(event) => period.setCustomDate("to", event.target.value)}
          />
          {period.customInvalid && (
            <p role="alert" className="self-center text-sm text-danger-ink">
              Elige ambas fechas, con la inicial antes de la final.
            </p>
          )}
        </div>
      )}

      <p className="text-xs text-body-faint">
        Lo que se debe, las comisiones pendientes y los vencimientos siempre se
        muestran al día de hoy.
      </p>
    </div>
  );
}
