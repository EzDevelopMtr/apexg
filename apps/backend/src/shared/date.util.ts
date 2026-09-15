/**
 * Huso horario de la operación (Colombia). Único lugar donde vive el
 * literal — cualquier consulta SQL que necesite agrupar/filtrar un
 * `TIMESTAMPTZ` por día calendario LOCAL (no UTC) debe usarlo vía
 * `AT TIME ZONE ${APP_TIMEZONE}` en vez de repetir el string.
 */
export const APP_TIMEZONE = 'America/Bogota';

/**
 * Fecha de hoy en el calendario LOCAL, como `YYYY-MM-DD`.
 *
 * `new Date().toISOString().slice(0, 10)` es un bug real, no cosmético:
 * en cualquier huso horario detrás de UTC (Colombia, UTC-5), a partir de
 * las 19:00 ese cálculo ya da la fecha de MAÑANA. Ya se corrigió una vez
 * en el frontend (`@apexg/core`); esta es la misma corrección del lado
 * del backend — usar los componentes LOCALES de `Date`, no `toISOString`.
 */
export function today(): string {
  return toLocalDate(new Date());
}

/**
 * Convierte un instante (timestamp UTC, típicamente `TIMESTAMPTZ` como
 * `paid_at`) al día calendario LOCAL — nunca cortar el string ISO con
 * `.slice(0, 10)`: eso toma el día en UTC, que en Bogotá (UTC-5) puede
 * ser el día siguiente al que realmente ocurrió el evento localmente.
 */
export function toLocalDate(instant: string | Date): string {
  const date = typeof instant === 'string' ? new Date(instant) : instant;
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
