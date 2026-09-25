import type { payments } from '../database/schema/schema.js';

import type {
  CommissionSummary,
  PaymentResult,
  PaymentType,
} from './payments.types.js';

type PaymentRow = typeof payments.$inferSelect;

/** Qué clase de pago es, según cuántos hubo antes y si este salda el saldo. */
export function classifyPaymentType(
  previousCount: number,
  settles: boolean,
): PaymentType {
  if (previousCount === 0) {
    return settles ? 'full' : 'first_installment';
  }
  return settles ? 'final_installment' : 'second_installment';
}

/** La fila del pago tal como la expone la API. */
export function toPaymentResult(
  row: PaymentRow,
  commission: CommissionSummary | null,
  recordedBy: string,
): PaymentResult {
  return {
    id: row.id,
    clientMembershipId: row.clientMembershipId,
    amount: row.amount,
    paymentType: row.paymentType as PaymentType,
    installmentNumber: row.installmentNumber,
    paymentMethod: row.paymentMethod as PaymentResult['paymentMethod'],
    balanceAfter: row.balanceAfter,
    paidAt: row.paidAt,
    notes: row.notes,
    receiptPath: row.receiptPath,
    commission,
    recordedBy,
  };
}
