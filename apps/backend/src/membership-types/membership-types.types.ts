/**
 * Tipos del módulo Membresías (RF-12, RF-13).
 *
 * Los montos viajan como `string` (NUMERIC), igual que en `clients/` — ver
 * CLAUDE.md, sección NUMERIC.
 */

export type DurationUnit = "day" | "week" | "month";

/** Estado de un plan (schema.dbml): 1 = activo · 2 = inactivo. Sin tercer
 * estado derivado — a diferencia de `clients.state`, esto lo controla
 * únicamente el administrador. */
export type MembershipTypeState = 1 | 2;

export interface MembershipTypeResult {
  id: string;
  name: string;
  price: string;
  description: string | null;
  durationValue: number;
  durationUnit: DurationUnit;
  minimumPayment: string | null;
  trainerShare: string | null;
  businessShare: string | null;
  allowsPartialPayment: boolean;
  isPromotional: boolean;
  /** Visitas que el plan permite por semana, o null si no tiene tope. */
  weeklyVisits: number;
  state: MembershipTypeState;
}

export interface ListMembershipTypesFilter {
  state?: MembershipTypeState;
  isPromotional?: boolean;
}
