import type { IsoDate } from "./calendar";
import type { ClientId, ClientStatus } from "./client";
import type { MembershipType } from "./membership";

declare const attendanceIdBrand: unique symbol;

export type AttendanceId = string & { readonly [attendanceIdBrand]: true };

export function toAttendanceId(value: string): AttendanceId {
  return value as AttendanceId;
}

/**
 * One visit to the gym.
 *
 * A visit is the DAY, not the stay: leaving at lunch and coming back is the
 * same visit, so `checkOut` only records that the person left. The gym sells
 * days of access, not trips through the door.
 */
export interface Attendance {
  readonly id: AttendanceId;
  readonly clientId: ClientId;
  /**
   * Denormalised so the day's list can render without a second lookup, the
   * same way `ProductSale` carries its item name. The list is read far more
   * often than a client is renamed.
   */
  readonly clientName: string;
  /** Local calendar day of the entry, for counting against the allowance. */
  readonly day: IsoDate;
  /** `HH:MM`, local, for the day's list. */
  readonly enteredAt: string;
  /** `HH:MM` once the person leaves, or empty while still inside. */
  readonly leftAt: string;
  /** Plan name at the time of the visit, for the day's list. */
  readonly membershipName: string;
  /** Weekly allowance of that plan. */
  readonly weeklyVisits: number;
  /** Days of the week already spent, including this one. */
  readonly usedThisWeek: number;
  /** Quién lo registró (RNF-07). "—" en los anteriores al rastro. */
  readonly recordedBy: string;
}

/** Still in the gym: entered and not yet marked out. */
export function isInside(attendance: Attendance): boolean {
  return attendance.leftAt === "";
}

export function peopleInside(
  attendances: readonly Attendance[],
): readonly Attendance[] {
  return attendances.filter(isInside);
}

/**
 * How many visits a plan grants per week.
 *
 * Always a number. "No cap" used to be `null`, but with the gym closed on
 * Sundays six visits already IS full access, so the two said the same thing
 * and one of them was a branch nobody could reach.
 */
export function weeklyAllowance(type: MembershipType): number {
  return type.weeklyVisits;
}

export interface VisitQuota {
  /** Visits already used this week. */
  readonly used: number;
  /** What the plan grants. */
  readonly allowed: number;
  /** True once the allowance is spent. */
  readonly exhausted: boolean;
}

/**
 * The client's standing for the week.
 *
 * Takes the allowance rather than the plan: the check-in panel reads that
 * number off a search result that never carries a whole `MembershipType`, and
 * asking for one only to pull a single field forced a cast at the call site.
 *
 * Counting is left to the caller, which knows the week's boundaries — this
 * only decides what the number means.
 */
export function visitQuota(allowed: number, usedThisWeek: number): VisitQuota {
  return {
    used: usedThisWeek,
    allowed,
    exhausted: usedThisWeek >= allowed,
  };
}

/** Why an entry was refused. `null` means it may go ahead. */
export type CheckInRefusal =
  "noMembership" | "inactive" | "overdue" | "quotaSpent";

/** User-facing reasons, in Spanish. */
export const CHECK_IN_REFUSAL_LABELS: Record<CheckInRefusal, string> = {
  noMembership: "No tiene una membresía registrada.",
  inactive: "Cliente retirado.",
  overdue: "Membresía vencida. Debe renovar para ingresar.",
  quotaSpent: "Ya usó todos sus días de esta semana.",
};

/**
 * Whether this client may enter right now.
 *
 * One place for the whole decision instead of the panel testing three things
 * in a row: the API has to refuse exactly the same cases, and a rule split
 * across call sites drifts the moment one of them is edited.
 *
 * Order matters. An expired membership is reported as expired even when the
 * week's allowance is also spent, because renewing is what unblocks them —
 * telling them to wait until Monday would be wrong and they would come back
 * on Monday to be refused again.
 */
export function checkInRefusal(
  status: ClientStatus | null,
  quota: VisitQuota,
): CheckInRefusal | null {
  if (status === null) return "noMembership";
  if (status === "inactive") return "inactive";
  if (status === "overdue") return "overdue";
  return quota.exhausted ? "quotaSpent" : null;
}
