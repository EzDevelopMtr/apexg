import type { IsoDate } from "./calendar";
import type { ClientId } from "./client";
import type { MembershipType } from "./membership";

declare const attendanceIdBrand: unique symbol;

export type AttendanceId = string & { readonly [attendanceIdBrand]: true };

export function toAttendanceId(value: string): AttendanceId {
  return value as AttendanceId;
}

/**
 * One visit to the gym.
 *
 * A visit is the ENTRY, not the stay: `checkOut` only says the person left.
 * Re-entering the same day is a second visit and spends another day of the
 * weekly allowance — the receptionist marking someone out and back in is
 * recording two uses, which is what the gym is actually selling.
 */
export interface Attendance {
  readonly id: AttendanceId;
  readonly clientId: ClientId;
  /** Local calendar day of the entry, for counting against the allowance. */
  readonly day: IsoDate;
  /** `HH:MM`, local, for the day's list. */
  readonly enteredAt: string;
  /** `HH:MM` once the person leaves, or empty while still inside. */
  readonly leftAt: string;
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
 * How many visits a plan grants per week, or `null` when it is unlimited.
 *
 * Unlimited is not "a big number": the monthly plan has no weekly cap at all,
 * and saying 7 would quietly invent a rule nobody agreed to.
 */
export function weeklyAllowance(type: MembershipType): number | null {
  return type.weeklyVisits;
}

export interface VisitQuota {
  /** Visits already used this week. */
  readonly used: number;
  /** What the plan grants, or `null` when unlimited. */
  readonly allowed: number | null;
  /** True once the allowance is spent. Always false for an unlimited plan. */
  readonly exhausted: boolean;
}

/**
 * The client's standing for the week.
 *
 * Counting is left to the caller, which knows the week's boundaries — this
 * only decides what the number means against the plan.
 */
export function visitQuota(
  type: MembershipType,
  usedThisWeek: number,
): VisitQuota {
  const allowed = weeklyAllowance(type);
  return {
    used: usedThisWeek,
    allowed,
    exhausted: allowed !== null && usedThisWeek >= allowed,
  };
}
