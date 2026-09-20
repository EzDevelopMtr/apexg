import type { Term } from "./calendar";
import type { Money } from "./money";
import { isLessThan } from "./money";

declare const membershipTypeIdBrand: unique symbol;

/**
 * Identifies a membership type in the catalogue (SRS §4.1).
 *
 * RF-12 lets the administrator create, edit and delete plans, so this is an
 * opaque id from the data layer (a real backend hands out a UUID here) —
 * never a fixed set of slugs. `packages/data/src/in-memory/seed-*.ts` is the
 * only place still allowed to assume the nine plans SRS §4.1 lists as the
 * starting catalogue.
 */
export type MembershipTypeId = string & {
  readonly [membershipTypeIdBrand]: true;
};

export function toMembershipTypeId(value: string): MembershipTypeId {
  return value as MembershipTypeId;
}

/**
 * How a plan's payment splits between the assigned trainer and the business
 * (SRS §4.4). Only the personal and semi-personal plans have one.
 */
export interface TrainerSplit {
  readonly trainer: Money;
  readonly business: Money;
}

/** A membership the gym sells (SRS §4.1). */
export interface MembershipType {
  readonly id: MembershipTypeId;
  /** User-facing name, in Spanish. */
  readonly name: string;
  readonly price: Money;
  readonly term: Term;
  /**
   * Smallest acceptable first installment (SRS §4.3), or `null` when the plan
   * must be paid in full.
   */
  readonly minimumInstallment: Money | null;
  readonly isPromotional: boolean;
  readonly trainerSplit: TrainerSplit | null;
  /**
   * Days a week the plan grants, 1 to 6.
   *
   * Six is the ceiling and also means "no limit": the gym closes on Sundays,
   * so nobody can attend a seventh day anyway. There is deliberately no null
   * for "uncapped" — it would be a second way to say six.
   */
  readonly weeklyVisits: number;
  /** User-facing conditions, in Spanish. */
  readonly conditions: string;
}

/** Whether the plan may be paid in parts (SRS §4.3). */
export function allowsInstallments(type: MembershipType): boolean {
  return type.minimumInstallment !== null;
}

/** Whether the plan requires an assigned trainer (RF-24). */
export function requiresTrainer(type: MembershipType): boolean {
  return type.trainerSplit !== null;
}

/** Why a proposed installment was rejected. */
export type InstallmentRejection =
  "notAllowed" | "belowMinimum" | "notPositive" | "exceedsPrice";

export type InstallmentCheck =
  | { readonly accepted: true }
  | { readonly accepted: false; readonly reason: InstallmentRejection };

/**
 * Validates a first installment against the plan's minimum (RF-19).
 *
 * Lives in `core` rather than in the form because the API must reject the same
 * values (RNF-07: financial rules are consistent and traceable).
 */
export function checkInstallment(
  type: MembershipType,
  amount: Money,
): InstallmentCheck {
  if (amount <= 0) {
    return { accepted: false, reason: "notPositive" };
  }
  if (type.minimumInstallment === null) {
    return { accepted: false, reason: "notAllowed" };
  }
  if (isLessThan(amount, type.minimumInstallment)) {
    return { accepted: false, reason: "belowMinimum" };
  }
  if (amount > type.price) {
    return { accepted: false, reason: "exceedsPrice" };
  }
  return { accepted: true };
}
