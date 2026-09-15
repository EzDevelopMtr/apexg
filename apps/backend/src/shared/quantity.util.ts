import { BadRequestException } from '@nestjs/common';

/**
 * `NUMERIC(12,3)` de cantidades de inventario viaja como string, igual que
 * el dinero (ver money-amount.util.ts) — nunca se convierte a `Number` para
 * guardarlo. Estas utilidades convierten a "milésimas" (enteros) SOLO para
 * sumar/restar stock sin el error de redondeo de punto flotante; lo que
 * llega a Drizzle es siempre el string.
 *
 * A diferencia del dinero, una cantidad puede ser negativa (el delta con
 * signo de un ajuste de inventario), por eso el patrón admite un `-` inicial.
 */
const QUANTITY_PATTERN = /^-?\d+(\.\d{1,3})?$/;

export function isValidQuantityString(value: string): boolean {
  return QUANTITY_PATTERN.test(value);
}

export function toMilliUnits(value: string): number {
  if (!isValidQuantityString(value)) {
    throw new BadRequestException(`Cantidad inválida: "${value}".`);
  }
  const negative = value.startsWith('-');
  const unsigned = negative ? value.slice(1) : value;
  const [whole, fraction = ''] = unsigned.split('.');
  const magnitude = Number(whole) * 1000 + Number(fraction.padEnd(3, '0'));
  return negative ? -magnitude : magnitude;
}

/** Inversa de `toMilliUnits`: formatea de vuelta al string NUMERIC("X.XXX"). */
export function fromMilliUnits(milliUnits: number): string {
  const negative = milliUnits < 0;
  const absolute = Math.abs(Math.round(milliUnits));
  const whole = Math.floor(absolute / 1000);
  const fraction = String(absolute % 1000).padStart(3, '0');
  return `${negative ? '-' : ''}${whole}.${fraction}`;
}
