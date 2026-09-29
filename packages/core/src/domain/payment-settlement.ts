import type { IsoDate } from "./calendar";
import type { CycleId, Payment } from "./payment";

/**
 * El día en que cada ciclo quedó saldado, para los que ya lo están.
 *
 * Se calcula sobre TODOS los pagos, no sobre los que la tabla muestra: si
 * alguien filtra por "Abono", el pago final queda oculto, y el abono tiene que
 * seguir diciendo que esa deuda ya se pagó.
 */
export function settlementDates(
  payments: readonly Payment[],
): ReadonlyMap<CycleId, IsoDate> {
  const dates = new Map<CycleId, IsoDate>();
  for (const payment of payments) {
    if (payment.balanceAfter > 0) continue;
    const known = dates.get(payment.cycleId);
    if (!known || payment.paidOn < known) dates.set(payment.cycleId, payment.paidOn);
  }
  return dates;
}

/**
 * Si este abono dejó saldo que se pagó después, el día en que se saldó.
 *
 * La columna muestra el saldo que quedó JUSTO tras este pago: $15.000 después
 * del primer abono sigue siendo cierto aunque el cliente ya lo haya
 * completado. Sin esta marca, esa fila se leía como una deuda vigente.
 */
export function settledLaterOn(
  payment: Payment,
  dates: ReadonlyMap<CycleId, IsoDate>,
): IsoDate | null {
  if (payment.balanceAfter <= 0) return null;
  return dates.get(payment.cycleId) ?? null;
}
