/**
 * Tipos del módulo Pagos (RF-17 a RF-20, SRS §4.4).
 *
 * Los montos viajan como `string` (NUMERIC) — ver CLAUDE.md, sección
 * NUMERIC, y `shared/money-amount.util.ts`.
 */

/**
 * `payment_method` es `VARCHAR(20)` libre (sin CHECK a nivel de BD, ver
 * CLAUDE.md "Sin ENUM, CHECK de negocio"), así que la restricción a estos dos
 * la impone el DTO, no la columna.
 *
 * Solo dos: Nequi, Bancolombia o tarjeta terminan igual para el gimnasio —el
 * dinero entra a la cuenta y hay una pantalla que lo prueba—, y lo único sobre
 * lo que el sistema decide es si hay comprobante que adjuntar. Espejo de
 * `PaymentMethod` en `@apexg/core`. La migración 009 normalizó las filas que
 * ya tenían otro valor.
 */
export type PaymentMethod = "cash" | "transfer";

/**
 * `payment_type` es un `VARCHAR(20)` con solo 4 categorías gruesas
 * (full/first/second/final) — el número EXACTO de abono vive en
 * `installment_number` (migración 004), no aquí.
 */
export type PaymentType =
  "full" | "first_installment" | "second_installment" | "final_installment";

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
  /** Nombre del archivo del comprobante, o null si no tiene. Nunca una URL. */
  receiptPath: string | null;
  /** Presente solo si el plan tiene reparto y la membresía tiene entrenador. */
  commission: CommissionSummary | null;
}

export interface ListPaymentsFilter {
  clientMembershipId?: string;
}
