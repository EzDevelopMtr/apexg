/**
 * Calendar arithmetic for membership terms.
 *
 * Dates are handled as `YYYY-MM-DD` strings in the gym's local calendar, not as
 * `Date` objects: a membership expires on a calendar day, and timezone-aware
 * instants would make "expires on the 30th" ambiguous near midnight.
 */

declare const isoDateBrand: unique symbol;

/** A calendar day in `YYYY-MM-DD` form. Build one with {@link toIsoDate}. */
export type IsoDate = string & { readonly [isoDateBrand]: true };

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Formats a `Date` as a calendar day, using its local components. */
export function toIsoDate(date: Date): IsoDate {
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}` as IsoDate;
}

/** Narrows a string to {@link IsoDate}, rejecting impossible days like 2026-02-30. */
export function isIsoDate(value: string): value is IsoDate {
  if (!ISO_DATE_PATTERN.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00`);
  return !Number.isNaN(parsed.getTime()) && toIsoDate(parsed) === value;
}

/** Parses a calendar day into a local `Date` at midnight. */
export function fromIsoDate(value: IsoDate): Date {
  return new Date(`${value}T00:00:00`);
}

/** Today, in the gym's local calendar. */
export function today(): IsoDate {
  return toIsoDate(new Date());
}

export function addDays(date: IsoDate, days: number): IsoDate {
  const result = fromIsoDate(date);
  result.setDate(result.getDate() + days);
  return toIsoDate(result);
}

/**
 * Adds whole months, clamping to the last day of the target month.
 *
 * Without clamping, 31 January + 1 month would roll over into March, silently
 * granting a client two extra days of membership.
 */
export function addMonths(date: IsoDate, months: number): IsoDate {
  const source = fromIsoDate(date);
  const targetDay = source.getDate();

  const result = new Date(source);
  result.setDate(1);
  result.setMonth(result.getMonth() + months);

  const lastDayOfTargetMonth = new Date(
    result.getFullYear(),
    result.getMonth() + 1,
    0,
  ).getDate();

  result.setDate(Math.min(targetDay, lastDayOfTargetMonth));
  return toIsoDate(result);
}

/** Whole days from `from` to `to`. Negative when `to` is in the past. */
export function daysBetween(from: IsoDate, to: IsoDate): number {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const difference = fromIsoDate(to).getTime() - fromIsoDate(from).getTime();
  return Math.round(difference / millisecondsPerDay);
}

export function isBefore(date: IsoDate, other: IsoDate): boolean {
  return date < other;
}

export function isAfter(date: IsoDate, other: IsoDate): boolean {
  return date > other;
}

/** How a membership term is measured. */
export type TermUnit = "day" | "month";

/** The validity period of a membership type (SRS §4.1). */
export interface Term {
  readonly unit: TermUnit;
  readonly amount: number;
}

/**
 * The day a membership starting on `startDate` expires (RF-07).
 *
 * Follows the worked examples in SRS §4.1: a fortnight starting 15 June expires
 * 30 June; a monthly membership starting 1 June expires 1 July.
 */
export function calculateExpirationDate(
  startDate: IsoDate,
  term: Term,
): IsoDate {
  return term.unit === "month"
    ? addMonths(startDate, term.amount)
    : addDays(startDate, term.amount);
}

/** A closed range of calendar days, both ends inclusive. */
export interface DateRange {
  readonly from: IsoDate;
  readonly to: IsoDate;
}

export function isWithin(date: IsoDate, range: DateRange): boolean {
  return date >= range.from && date <= range.to;
}

/** Monday of the week containing `date`. The gym's week starts on Monday. */
export function startOfWeek(date: IsoDate): IsoDate {
  const weekday = fromIsoDate(date).getDay();
  const daysSinceMonday = weekday === 0 ? 6 : weekday - 1;
  return addDays(date, -daysSinceMonday);
}

export function startOfMonth(date: IsoDate): IsoDate {
  return `${date.slice(0, 7)}-01` as IsoDate;
}

/**
 * Last day of the month containing `date`.
 *
 * Computed rather than assumed: building the range end as `YYYY-MM-31` happens
 * to work under string comparison but denotes a day that does not exist, and
 * breaks the moment the value is parsed instead of compared.
 */
export function endOfMonth(date: IsoDate): IsoDate {
  const source = fromIsoDate(date);
  const lastDay = new Date(
    source.getFullYear(),
    source.getMonth() + 1,
    0,
  ).getDate();
  return `${date.slice(0, 7)}-${String(lastDay).padStart(2, "0")}` as IsoDate;
}

/** The day, week or month containing `date`. */
export function rangeFor(
  period: "day" | "week" | "month",
  date: IsoDate,
): DateRange {
  if (period === "day") return { from: date, to: date };
  if (period === "week") {
    const from = startOfWeek(date);
    return { from, to: addDays(from, 6) };
  }
  return { from: startOfMonth(date), to: endOfMonth(date) };
}

/** The same day one month earlier, clamped like {@link addMonths}. */
export function previousMonth(date: IsoDate): IsoDate {
  return addMonths(date, -1);
}
