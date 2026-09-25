import type { PaymentMethod } from '../payments/payments.types.js';

/** Venta de un ítem de inventario — ver migración 006 para el porqué de la tabla propia. */
export interface ProductSaleResult {
  id: string;
  inventoryItemId: string;
  itemName: string;
  clientId: string | null;
  clientName: string | null;
  quantity: string;
  amount: string;
  paymentMethod: PaymentMethod;
  soldAt: string;
  notes: string | null;
  /** Quién la registró, para el rastro de RNF-07. "—" si es anterior. */
  recordedBy: string;
}
