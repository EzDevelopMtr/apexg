import { BadRequestException } from '@nestjs/common';

/**
 * `NUMERIC(12,2)` viaja como string entre Drizzle y el dominio (CLAUDE.md,
 * sección NUMERIC) — nunca se convierte a `Number` para guardarlo ni para
 * transportarlo. Estas utilidades convierten a centavos SOLO para validar
 * o calcular invariantes entre montos (sumas, reparticiones, saldos); lo
 * que llega a Drizzle es siempre el string, nunca el número intermedio.
 *
 * Se usa aritmética de enteros (nunca `parseFloat`) porque la escala está
 * fija en 2 decimales: comparar o sumar dinero en punto flotante puede no
 * dar un resultado exacto, y aquí se compara igualdad exacta.
 *
 * Compartido por `membership-types/` (reparto entrenador/negocio) y
 * `payments/` (saldos, comisiones) — la tercera vez que hizo falta fue la
 * señal de sacarla de un módulo a un lugar común.
 */
const MONEY_PATTERN = /^\d+(\.\d{1,2})?$/;

export function isValidMoneyString(value: string): boolean {
  return MONEY_PATTERN.test(value);
}

export function toCents(value: string): number {
  if (!isValidMoneyString(value)) {
    throw new BadRequestException(`Monto inválido: "${value}".`);
  }
  const [whole, fraction = ''] = value.split('.');
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
}

/** Inversa de `toCents`: formatea de vuelta al string NUMERIC("X.XX"). */
export function fromCents(cents: number): string {
  const negative = cents < 0;
  const absolute = Math.abs(Math.round(cents));
  const whole = Math.floor(absolute / 100);
  const fraction = String(absolute % 100).padStart(2, '0');
  return `${negative ? '-' : ''}${whole}.${fraction}`;
}
