import type { IsoDate } from "./calendar";
import type { ClientId } from "./client";
import type { MembershipType, MembershipTypeId } from "./membership";
import type { Money } from "./money";
import { ZERO, atLeastZero, isLessThan, subtract } from "./money";

declare const paymentIdBrand: unique symbol;
declare const cycleIdBrand: unique symbol;

export type PaymentId = string & { readonly [paymentIdBrand]: true };

/**
 * Groups the payments that settle one membership period.
 *
 * A client who renews starts a new cycle, so last month's settled balance
 * never bleeds into this month's.
 */
export type CycleId = string & { readonly [cycleIdBrand]: true };

export function toPaymentId(value: string): PaymentId {
  return value as PaymentId;
}

export function toCycleId(clientId: ClientId, startDate: IsoDate): CycleId {
  return `${clientId}:${startDate}` as CycleId;
}

/**
 * How the client paid (RF-04, "forma de pago").
 *
 * Two, on purpose. Nequi, Bancolombia and a card all end the same way for the
 * gym: money lands in the account and there is a screen that proves it. Naming
 * each one bought a longer dropdown and four more values to keep in step
 * across five layers, while the only thing the system branches on is whether
 * there is a receipt to attach — and that is a two-way split.
 */
export type PaymentMethod = "cash" | "transfer";

/** User-facing payment method names, in Spanish. */
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Efectivo",
  transfer: "Transferencia",
};

/**
 * Whether a payment has to carry a photo of its receipt.
 *
 * Cash changes hands in person with the receptionist as witness, so there is
 * nothing to capture. A transfer leaves a screen on the payer's phone, and
 * that screenshot is the only thing the gym can check a disputed payment
 * against months later (RNF-07: financial records stay traceable).
 *
 * A rule, not a form detail: the API has to reject exactly what the form
 * rejects, or the requirement only holds while people use our UI.
 */
export function requiresReceipt(method: PaymentMethod): boolean {
  return method !== "cash";
}

/**
 * The label a payment carries (RF-20).
 *
 * `full` settles the membership in one go. Partial payments are numbered, and
 * whichever one clears the balance is the final instalment.
 */
export type PaymentKind = "full" | "installment" | "finalInstallment";

export interface Payment {
  readonly id: PaymentId;
  readonly clientId: ClientId;
  readonly cycleId: CycleId;
  readonly membershipTypeId: MembershipTypeId;
  /** Price agreed for this cycle, snapshotted so later catalogue edits (RF-12)
   *  cannot rewrite history (RNF-07). */
  readonly agreedPrice: Money;
  readonly amount: Money;
  /** Outstanding balance *after* this payment. */
  readonly balanceAfter: Money;
  readonly kind: PaymentKind;
  /** 1 for the first payment of the cycle, 2 for the second, and so on. */
  readonly sequence: number;
  readonly paidOn: IsoDate;
  readonly method: PaymentMethod;
  /**
   * Server-side path of the uploaded receipt, or empty when there is none.
   * Never a URL the browser can hit directly: the file is served through an
   * authenticated endpoint, because a receipt carries someone else's money.
   */
  readonly receiptPath: string;
  readonly recordedBy: string;
  readonly notes: string;
}

/** Payments belonging to one cycle, oldest first. */
export function paymentsInCycle(
  payments: readonly Payment[],
  cycleId: CycleId,
): readonly Payment[] {
  return payments
    .filter((payment) => payment.cycleId === cycleId)
    .sort((a, b) => a.sequence - b.sequence);
}

export function totalPaid(
  payments: readonly Payment[],
  cycleId: CycleId,
): Money {
  return paymentsInCycle(payments, cycleId).reduce<Money>(
    (running, payment) => (running + payment.amount) as Money,
    ZERO,
  );
}

/** What the client still owes for the cycle (RF-18). Never negative. */
export function outstandingBalance(
  payments: readonly Payment[],
  cycleId: CycleId,
  agreedPrice: Money,
): Money {
  return atLeastZero(subtract(agreedPrice, totalPaid(payments, cycleId)));
}

/**
 * Labels a payment (RF-20).
 *
 * The label follows the sequence rather than a fixed 1st/2nd vocabulary: RF-12
 * lets the administrator lower a plan's minimum, which allows more than three
 * payments per cycle. A fixed vocabulary would then label the third, fourth
 * and fifth payment all as "2do abono".
 */
export function classifyPayment(
  previousPaymentCount: number,
  balanceAfter: Money,
): PaymentKind {
  const settles = balanceAfter <= 0;

  if (previousPaymentCount === 0) {
    return settles ? "full" : "installment";
  }
  return settles ? "finalInstallment" : "installment";
}

/** User-facing label for a payment, in Spanish (RF-20). */
export function paymentLabel(payment: Payment): string {
  if (payment.kind === "full") return "Pago completo";
  if (payment.kind === "finalInstallment") return "Abono final";
  return `${payment.sequence}.º abono`;
}

export type PaymentRejection =
  "notPositive" | "exceedsBalance" | "installmentsNotAllowed" | "belowMinimum";

export type PaymentCheck =
  | { readonly accepted: true }
  | { readonly accepted: false; readonly reason: PaymentRejection };

/**
 * Validates an amount against the plan and the outstanding balance (RF-19).
 *
 * Lives here rather than in the form because the API must reject the same
 * values (RNF-07: financial rules are consistent and traceable).
 */
export function checkPayment(
  type: MembershipType,
  amount: Money,
  balanceBefore: Money,
): PaymentCheck {
  if (amount <= 0) {
    return { accepted: false, reason: "notPositive" };
  }
  if (amount > balanceBefore) {
    return { accepted: false, reason: "exceedsBalance" };
  }

  // Paying the balance off in full is always allowed, whatever the minimum.
  const settles = amount === balanceBefore;
  if (settles) {
    return { accepted: true };
  }

  if (type.minimumInstallment === null) {
    return { accepted: false, reason: "installmentsNotAllowed" };
  }
  if (isLessThan(amount, type.minimumInstallment)) {
    return { accepted: false, reason: "belowMinimum" };
  }
  return { accepted: true };
}

/**
 * The latest payment of each cycle that still leaves a balance (RF-18).
 *
 * Filtering on `balanceAfter > 0` alone would keep showing a settled client:
 * their first instalment left a balance at the time, and that snapshot never
 * changes. Only the last payment of a cycle says what is owed now.
 */
export function cyclesWithBalance(
  payments: readonly Payment[],
): readonly Payment[] {
  const latestByCycle = new Map<CycleId, Payment>();

  for (const payment of payments) {
    const current = latestByCycle.get(payment.cycleId);
    if (!current || payment.sequence > current.sequence) {
      latestByCycle.set(payment.cycleId, payment);
    }
  }

  return [...latestByCycle.values()].filter(
    (payment) => payment.balanceAfter > 0,
  );
}
