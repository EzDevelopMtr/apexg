import type { PaymentMethod } from "../payments/payments.types.js";

/** Un día vendido a un visitante — ver migración 018. */
export interface DayPassResult {
  id: string;
  membershipTypeId: string;
  visitorName: string;
  visitorContact: string | null;
  amount: string;
  paymentMethod: PaymentMethod;
  soldAt: string;
  /** Nombre del archivo del comprobante, o null si no tiene. Nunca una URL. */
  receiptPath: string | null;
  /** Quién lo vendió, para el rastro de RNF-07. */
  recordedBy: string;
}
