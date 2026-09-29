"use client";

import { useMemo, useState } from "react";
import type { DateRange, FinancePeriod, FinancePeriodId, IsoDate } from "@apexg/core";
import {
  DEFAULT_FINANCE_PERIOD,
  FINANCE_PERIODS,
  customRange,
  formatRange,
  isFinancePeriodId,
} from "@apexg/core";

const periodOf = (id: FinancePeriodId): FinancePeriod =>
  FINANCE_PERIODS.find((period) => period.id === id) ?? (FINANCE_PERIODS[0] as FinancePeriod);

const presetRange = (id: FinancePeriodId, on: IsoDate): DateRange | undefined =>
  periodOf(id).rangeOn?.(on);

/**
 * Qué periodo mira la vista de Finanzas.
 *
 * Con el personalizado, mientras las fechas están a medio escribir o al revés,
 * las cifras siguen mostrando el último rango válido: cambiarlas a otro
 * periodo mientras los campos dicen algo distinto sería leer un número que no
 * corresponde a lo que está en pantalla.
 */
export function useFinancePeriod(on: IsoDate) {
  const [initial] = useState(() => presetRange(DEFAULT_FINANCE_PERIOD, on) as DateRange);
  const [periodId, setPeriodId] = useState<FinancePeriodId>(DEFAULT_FINANCE_PERIOD);
  const [custom, setCustom] = useState({ from: initial.from as string, to: initial.to as string });
  const [lastCustom, setLastCustom] = useState<DateRange>(initial);

  // Memorizado: cada cifra de la vista se recalcula cuando cambia este objeto.
  const range = useMemo(
    () => (periodId === "custom" ? lastCustom : (presetRange(periodId, on) ?? initial)),
    [periodId, on, lastCustom, initial],
  );

  const select = (id: string) => {
    if (!isFinancePeriodId(id)) return;
    // Al pasar a personalizado se parte del rango que se estaba viendo: lo
    // normal es ajustar un extremo, no escribir las dos fechas desde cero.
    if (id === "custom" && periodId !== "custom") {
      setCustom({ from: range.from, to: range.to });
      setLastCustom(range);
    }
    setPeriodId(id);
  };

  const setCustomDate = (field: "from" | "to", value: string) => {
    const next = { ...custom, [field]: value };
    setCustom(next);
    const valid = customRange(next.from, next.to);
    if (valid) setLastCustom(valid);
  };

  return {
    periods: FINANCE_PERIODS,
    period: periodOf(periodId),
    range,
    rangeLabel: formatRange(range),
    custom,
    /** Las fechas escritas no forman un rango: falta una o están al revés. */
    customInvalid: periodId === "custom" && customRange(custom.from, custom.to) === null,
    select,
    setCustomDate,
  };
}

export type UseFinancePeriodResult = ReturnType<typeof useFinancePeriod>;
