import type { IsoDate } from "./calendar";
import type { MembershipType, MembershipTypeId } from "./membership";
import type { Money } from "./money";
import type { PaymentMethod } from "./payment";
import { requiresReceipt } from "./payment";

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
  /** The plan it was sold at, so the price stays explained after it changes. */
  readonly membershipTypeId: MembershipTypeId;
  readonly visitorName: string;
  /** Document or phone, whichever the visitor gave. Empty if none. */
  readonly visitorContact: string;
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

/**
 * The plan a day pass is sold at: the regular plan that lasts exactly one day.
 *
 * Found by its term, not its name or id, so renaming "Día" or recreating it
 * from the catalogue screen keeps the pass working. Promotions are left out —
 * a promo is a price for a specific audience, not the counter price. With
 * more than one candidate, the cheapest wins: it is what a visitor would be
 * offered at the counter anyway.
 */
export function dayPassPlan(
  types: readonly MembershipType[],
): MembershipType | undefined {
  return types
    .filter(
      (type) =>
        !type.isPromotional && type.term.unit === "day" && type.term.amount === 1,
    )
    .sort((a, b) => a.price - b.price)[0];
}

/** What the receptionist fills in to sell a pass. */
export interface DayPassDraft {
  readonly visitorName: string;
  readonly visitorContact: string;
  readonly paymentMethod: PaymentMethod;
  readonly hasReceipt: boolean;
}

export type DayPassProblem = "nameRequired" | "receiptRequired";

/**
 * Why a pass cannot be sold yet, or an empty list when it can.
 *
 * The name is the one thing always asked for: without it the day's list says
 * "someone paid $6.000" and nobody can answer who was in the gym. The receipt
 * follows the same rule as a membership payment ({@link requiresReceipt}).
 */
export function dayPassProblems(draft: DayPassDraft): readonly DayPassProblem[] {
  const problems: DayPassProblem[] = [];
  if (draft.visitorName.trim().length === 0) problems.push("nameRequired");
  if (requiresReceipt(draft.paymentMethod) && !draft.hasReceipt) {
    problems.push("receiptRequired");
  }
  return problems;
}

/** Compared without spaces, dots or dashes: "300 123-4567" and "3001234567" are one person. */
function normalizeContact(contact: string): string {
  return contact.toLowerCase().replace(/[^0-9a-z]/g, "");
}

/**
 * Passes the same visitor already bought in the month containing `on`.
 *
 * Matched by document or phone, never by name: two "Carlos" in a month are
 * not the same person, and one visitor may spell theirs differently each day.
 * Without a contact there is nothing to match, so it is always zero.
 */
export function passesThisMonth(
  passes: readonly DayPass[],
  contact: string,
  on: IsoDate,
): number {
  const key = normalizeContact(contact);
  if (key === "") return 0;
  const month = on.slice(0, 7);
  return passes.filter(
    (pass) =>
      pass.soldOn.slice(0, 7) === month &&
      normalizeContact(pass.visitorContact) === key,
  ).length;
}

/**
 * From how many earlier passes in the month the counter suggests a plan.
 *
 * Two: the third day in a month is where a pass stops being a visit and
 * starts being a habit — and a week costs about what four passes do while
 * covering seven days.
 */
export const FREQUENT_VISITOR_PASSES = 2;

/**
 * The plan to offer a visitor who keeps coming back: the cheapest regular plan
 * that lasts longer than a day.
 */
export function upgradePlan(
  types: readonly MembershipType[],
): MembershipType | undefined {
  return types
    .filter(
      (type) =>
        !type.isPromotional && !(type.term.unit === "day" && type.term.amount === 1),
    )
    .sort((a, b) => a.price - b.price)[0];
}
