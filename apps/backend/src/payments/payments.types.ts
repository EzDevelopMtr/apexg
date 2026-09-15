/**
 * Tipos del módulo Pagos (RF-17 a RF-20, SRS §4.4).
 *
 * Los montos viajan como `string` (NUMERIC) — ver CLAUDE.md, sección
 * NUMERIC, y `shared/money-amount.util.ts`.
 */

/**
 * `payment_method` es `VARCHAR(20)` libre (sin CHECK a nivel de BD, ver
 * CLAUDE.md "Sin ENUM, CHECK de negocio"). El comentario del esquema solo
 * documenta cash/card/transfer, pero el ERS y el catálogo ya usado en el
 * frontend (`@apexg/core`) incluyen "nequi" — un medio real en Colombia.
 * Se admite aquí porque nada en la base lo impide.
 */
export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'nequi';

/**
 * `payment_type` es un `VARCHAR(20)` con solo 4 categorías gruesas
 * (full/first/second/final) — el número EXACTO de abono vive en
 * `installment_number` (migración 004), no aquí.
 */
export type PaymentType =
  | 'full'
  | 'first_installment'
  | 'second_installment'
  | 'final_installment';

export interface CommissionSummary {
  trainerId: string;
  trainerAmount: string;
  businessAmount: string;
}

export interface PaymentResult {
  id: string;
  clientMembershipId: string;
  amount: string;
  paymentType: PaymentType;
  /** 1 para el primer pago de la membresía, 2 para el segundo, etc. */
  installmentNumber: number;
  paymentMethod: PaymentMethod;
  balanceAfter: string;
  paidAt: string;
  notes: string | null;
  /** Presente solo si el plan tiene reparto y la membresía tiene entrenador. */
  commission: CommissionSummary | null;
}

export interface ListPaymentsFilter {
  clientMembershipId?: string;
}
