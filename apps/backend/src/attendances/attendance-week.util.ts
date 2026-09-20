/**
 * Límites de la semana de asistencias.
 *
 * Semana de lunes a domingo en hora local, no "los últimos 7 días": es lo que
 * la recepcionista y el cliente entienden por "3 veces por semana", y hace que
 * el cupo se reponga en un momento fijo y predecible en vez de arrastrarse de
 * forma distinta para cada persona.
 */
export function weekBounds(reference: Date): { start: Date; end: Date } {
  const start = new Date(reference);
  // getDay(): 0 = domingo. Lo movemos para que el lunes sea el día 0.
  const offset = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - offset);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return { start, end };
}

/** Comienzo del día local de la fecha dada. */
export function dayStart(reference: Date): Date {
  const start = new Date(reference);
  start.setHours(0, 0, 0, 0);
  return start;
}
