import type { IsoDate } from "./calendar";
import type { Money } from "./money";
import type { PaymentMethod } from "./payment";
import { isMissingReceipt } from "./receipt";

declare const dayPassIdBrand: unique symbol;
export type DayPassId = string & { readonly [dayPassIdBrand]: true };

export function toDayPassId(value: string): DayPassId {
  return value as DayPassId;
}

/**
 * One day sold to a visitor, with no client record behind it.
 *
 * Its own entity rather than a {@link Payment}: a payment hangs off a
 * membership, and the point of the pass is that nobody opens one for someone
 * who is in town for a day. It still carries everything a payment carries for
 * the trail (RNF-07): who sold it, when, how it was paid and the receipt.
 */
export interface DayPass {
  readonly id: DayPassId;
  readonly visitorName: string;
  readonly amount: Money;
  readonly paymentMethod: PaymentMethod;
  readonly soldOn: IsoDate;
  /** `HH:MM`, local, for the day's list. */
  readonly soldAt: string;
  /** Empty when there is no receipt (cash). */
  readonly receiptPath: string;
  /** Quién lo vendió (RNF-07). */
  readonly recordedBy: string;
}

/** What the receptionist fills in to sell a pass. */
export interface DayPassDraft {
  readonly visitorName: string;
  /** Pesos as typed, like an expense: the price is the counter's, not a plan's. */
  readonly amountPesos: string;
  readonly paymentMethod: PaymentMethod;
  readonly hasReceipt: boolean;
}

export type DayPassProblem =
  "nameRequired" | "amountNotPositive" | "receiptRequired";

/**
 * Why a pass cannot be sold yet, or an empty list when it can.
 *
 * The name is always asked for: without it the day's list says "someone
 * paid $6.000" and nobody can answer who was in the gym. The amount is typed
 * and must be above zero — the day is not a membership, so no plan prices it.
 * The receipt follows the same rule as a membership payment
 * ({@link isMissingReceipt}).
 */
export function dayPassProblems(
  draft: DayPassDraft,
): readonly DayPassProblem[] {
  const problems: DayPassProblem[] = [];
  if (draft.visitorName.trim().length === 0) problems.push("nameRequired");
  if (!(Number(draft.amountPesos) > 0)) problems.push("amountNotPositive");
  if (isMissingReceipt(draft.paymentMethod, draft.hasReceipt)) {
    problems.push("receiptRequired");
  }
  return problems;
}
