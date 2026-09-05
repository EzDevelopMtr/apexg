import type { Term } from "./calendar";
import type { Money } from "./money";
import { isLessThan } from "./money";

/** Identifies a membership type in the catalogue (SRS §4.1). */
export type MembershipTypeId =
  | "monthly"
  | "monthlyThreeDays"
  | "fortnight"
  | "week"
  | "day"
  | "friendsPromo"
  | "flyerPromo"
  | "personalTraining"
  | "semiPersonal";

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
