import type { IsoDate } from "./calendar";
import type { Expense } from "./expense";
import type { Money } from "./money";
import { ZERO, add } from "./money";
import type { PaymentMethod } from "./payment";
import type { Commission, TrainerId } from "./trainer";

/**
 * One payout to a trainer: the commissions settled together, as one outgoing.
 *
 * The gym pays a trainer what has piled up in one go, so the list shows that
 * single movement of money, not the ten commissions behind it.
 */
export interface CommissionPayout {
  readonly id: string;
  readonly trainerId: TrainerId;
  readonly paidOn: IsoDate;
  readonly amount: Money;
  readonly method: PaymentMethod | null;
  readonly receiptPath: string;
  readonly commissions: readonly Commission[];
}

/**
 * Settled commissions grouped into the payouts they were paid in.
 *
 * Only the day survives on the client, so two payouts to the same trainer on
 * the same day, with the same method and receipt, read as one. The total is
 * still exact; only the count of movements would be off, and that case is
 * two receptionists paying the same trainer twice in a day.
 */
export function commissionPayouts(
  commissions: readonly Commission[],
): readonly CommissionPayout[] {
  const groups = new Map<string, Commission[]>();
  for (const commission of commissions) {
    if (commission.settledOn === null) continue;
    const key = [
      commission.trainerId,
      commission.settledOn,
      commission.settlementMethod ?? "",
      commission.settlementReceiptPath,
    ].join("|");
    groups.set(key, [...(groups.get(key) ?? []), commission]);
  }
  return [...groups.entries()].flatMap(([key, group]) => {
    const [first] = group;
    if (!first?.settledOn) return [];
    return [
      {
        id: key,
        trainerId: first.trainerId,
        paidOn: first.settledOn,
        amount: group.reduce<Money>((sum, one) => add(sum, one.amount), ZERO),
        method: first.settlementMethod,
        receiptPath: first.settlementReceiptPath,
        commissions: group,
      },
    ];
  });
}

/**
 * A row of the Expenses list: a recorded expense or a payout to a trainer.
 *
 * Both are money leaving the gym, and Finanzas counts both as outgoings, so
 * the list that answers "what did we spend" shows both.
 */
export type OutgoingEntry =
  | { readonly kind: "expense"; readonly id: string; readonly spentOn: IsoDate; readonly expense: Expense }
  | { readonly kind: "commissions"; readonly id: string; readonly spentOn: IsoDate; readonly payout: CommissionPayout };

/** Expenses and trainer payouts in one list, newest first. */
export function outgoingsOf(
  expenses: readonly Expense[],
  commissions: readonly Commission[],
): readonly OutgoingEntry[] {
  return [
    ...expenses.map(
      (expense): OutgoingEntry => ({ kind: "expense", id: expense.id, spentOn: expense.spentOn, expense }),
    ),
    ...commissionPayouts(commissions).map(
      (payout): OutgoingEntry => ({ kind: "commissions", id: payout.id, spentOn: payout.paidOn, payout }),
    ),
  ].sort((a, b) => b.spentOn.localeCompare(a.spentOn));
}
