/**
 * Aritmética de fechas para el fin de una membresía (RF-07).
 *
 * `duration_unit` admite 'day' | 'week' | 'month' por diseño de columna
 * (ver schema.dbml), aunque los datos sembrados hoy solo usan 'day' y
 * 'month'. Se implementan los tres para no romper si algún día se crea un
 * plan semanal.
 *
 * El caso delicado es 'month': sumar un mes a un día que no existe en el
 * mes destino (31 de enero, por ejemplo) debe caer en el último día de ese
 * mes, nunca desbordarse al mes siguiente — de lo contrario se regalan
 * días de membresía.
 */

export type DurationUnit = "day" | "week" | "month";

function toIso(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseIso(iso: string): Date {
  return new Date(`${iso}T00:00:00`);
}

function addDays(iso: string, days: number): string {
  const date = parseIso(iso);
  date.setDate(date.getDate() + days);
  return toIso(date);
}

function addMonths(iso: string, months: number): string {
  const source = parseIso(iso);
  const targetDay = source.getDate();

  const result = new Date(source);
  result.setDate(1);
  result.setMonth(result.getMonth() + months);

  const lastDayOfTargetMonth = new Date(
    result.getFullYear(),
    result.getMonth() + 1,
    0,
  ).getDate();

  result.setDate(Math.min(targetDay, lastDayOfTargetMonth));
  return toIso(result);
}

export function isDurationUnit(value: string): value is DurationUnit {
  return value === "day" || value === "week" || value === "month";
}

/** Fecha de fin de membresía a partir del inicio y la duración del plan (RF-07). */
export function calculateEndDate(
  startDate: string,
  durationValue: number,
  durationUnit: DurationUnit,
): string {
  if (durationUnit === "month") return addMonths(startDate, durationValue);
  if (durationUnit === "week") return addDays(startDate, durationValue * 7);
  return addDays(startDate, durationValue);
}

export function today(): string {
  return toIso(new Date());
}
