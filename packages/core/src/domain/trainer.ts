import type { IsoDate } from "./calendar";
import type { ClientId } from "./client";
import type { Money } from "./money";
import type { PaymentId, PaymentMethod } from "./payment";
import { isMissingReceipt } from "./receipt";

declare const trainerIdBrand: unique symbol;
export type TrainerId = string & { readonly [trainerIdBrand]: true };

export function toTrainerId(value: string): TrainerId {
  return value as TrainerId;
}

/** A trainer on staff (RF-22). */
export interface Trainer {
  readonly id: TrainerId;
  readonly fullName: string;
  readonly idNumber: string;
  readonly phone: string;
  /** Free text, "N/A" when the trainer holds none. */
  readonly certifications: string;
  readonly hiredOn: IsoDate;
  readonly salary: Money;
  /**
   * How many clients the trainer may take at once (RF-25).
   *
   * OPEN QUESTION (SRS §8): the client has not defined what "availability"
   * means — a headcount cap, time slots, or both. A cap is modelled here
   * because it is the weaker assumption and does not preclude adding slots.
   */
  readonly maxClients: number;
  readonly active: boolean;
}

/** A share of a personal-training payment owed to the trainer (RF-23, §4.4). */
export interface Commission {
  readonly id: string;
  readonly trainerId: TrainerId;
  readonly paymentId: PaymentId;
  readonly clientId: ClientId;
  readonly amount: Money;
  readonly earnedOn: IsoDate;
  /** True once the gym has paid it out. */
  readonly settled: boolean;
  /** How it was paid out. Null while unsettled, or if settled before it was asked. */
  readonly settlementMethod: PaymentMethod | null;
  /**
   * Receipt of the payout, or empty when there is none. Every commission
   * settled in one payout shares the same file.
   */
  readonly settlementReceiptPath: string;
}

/** What is confirmed to pay a trainer what they are owed. */
export interface CommissionSettlementDraft {
  readonly commissionCount: number;
  readonly method: PaymentMethod;
  readonly hasReceipt: boolean;
}

export type CommissionSettlementProblem = "nothingToSettle" | "receiptRequired";

/**
 * Why a payout cannot be recorded yet, or an empty list when it can.
 *
 * Money leaving the gym to a trainer follows the same receipt rule as any
 * other ({@link isMissingReceipt}); one payout, one receipt.
 */
export function commissionSettlementProblems(
  draft: CommissionSettlementDraft,
): readonly CommissionSettlementProblem[] {
  const problems: CommissionSettlementProblem[] = [];
  if (draft.commissionCount === 0) problems.push("nothingToSettle");
  if (isMissingReceipt(draft.method, draft.hasReceipt)) {
    problems.push("receiptRequired");
  }
  return problems;
}

/** The latest payout of a trainer that carries a receipt, to show it again. */
export function latestSettlementWithReceipt(
  commissions: readonly Commission[],
  trainerId: TrainerId,
): Commission | undefined {
  return commissions
    .filter(
      (commission) =>
        commission.trainerId === trainerId &&
        commission.settled &&
        commission.settlementReceiptPath !== "",
    )
    .at(-1);
}

export function assignedClientCount(
  clients: readonly { readonly trainerId?: TrainerId }[],
  trainerId: TrainerId,
): number {
  return clients.filter((client) => client.trainerId === trainerId).length;
}

/** Whether the trainer can take another client (RF-24, RF-25). */
export function hasCapacity(
  trainer: Trainer,
  currentClientCount: number,
): boolean {
  return trainer.active && currentClientCount < trainer.maxClients;
}

export function remainingCapacity(
  trainer: Trainer,
  currentClientCount: number,
): number {
  return Math.max(trainer.maxClients - currentClientCount, 0);
}

/** Commissions a trainer has earned but not yet been paid (RF-23). */
export function unsettledCommissions(
  commissions: readonly Commission[],
  trainerId: TrainerId,
): readonly Commission[] {
  return commissions.filter(
    (commission) => commission.trainerId === trainerId && !commission.settled,
  );
}

export function commissionTotal(commissions: readonly Commission[]): Money {
  return commissions.reduce<Money>(
    (running, commission) => (running + commission.amount) as Money,
    0 as Money,
  );
}
