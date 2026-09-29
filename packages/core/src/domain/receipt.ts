import type { PaymentMethod } from "./payment";
import { PAYMENT_METHOD_LABELS, requiresReceipt } from "./payment";

/**
 * Whether a movement of money is missing the receipt its method demands.
 *
 * One rule for every place money changes hands — a client payment, a day
 * pass, an expense, a commission paid to a trainer — so a transfer never
 * finds a flow where its evidence is optional (RNF-07).
 */
export function isMissingReceipt(
  method: PaymentMethod,
  hasReceipt: boolean,
): boolean {
  return requiresReceipt(method) && !hasReceipt;
}

/** Narrows free text (a `<select>` value, a multipart field) to a method. */
export function isPaymentMethod(value: string): value is PaymentMethod {
  return Object.hasOwn(PAYMENT_METHOD_LABELS, value);
}
