import type { DateRange, IsoDate } from "./calendar";
import {
  addDays,
  addMonths,
  daysBetween,
  endOfMonth,
  formatDayMonth,
  isIsoDate,
  monthAbbreviation,
  rangeFor,
  startOfMonth,
} from "./calendar";
import type { FinancialRecords } from "./finance";
import { balanceOver } from "./finance";
import type { Money } from "./money";

export type FinancePeriodId = "lastWeek" | "thisMonth" | "lastSixMonths" | "custom";

/** One option of the period filter on the Finances view. */
export interface FinancePeriod {
  readonly id: FinancePeriodId;
  /** User-facing, in Spanish. */
  readonly label: string;
  /** How the comparison reads next to a figure: "vs. mes anterior". */
  readonly versus: string;
  /** Null for the custom period, whose range is the dates picked. */
  readonly rangeOn: ((on: IsoDate) => DateRange) | null;
}

/**
 * The periods the owner can look at, in the order the filter shows them.
 *
 * A record per option rather than a switch in the view: adding "Mes pasado"
 * means adding an entry here, nothing else. "Últimos 6 meses" is there
 * because it was the view before the filter existed — the one that answers
 * whether the gym is growing, which a single week or month cannot.
 */
export const FINANCE_PERIODS: readonly FinancePeriod[] = [
  {
    id: "lastWeek",
    label: "Semana pasada",
    versus: "vs. la semana anterior",
    rangeOn: (on) => rangeFor("week", addDays(on, -7)),
  },
  {
    id: "thisMonth",
    label: "Mes actual",
    versus: "vs. mes anterior",
    rangeOn: (on) => rangeFor("month", on),
  },
  {
    id: "lastSixMonths",
    label: "Últimos 6 meses",
    versus: "vs. los 6 meses anteriores",
    rangeOn: (on) => ({
      from: addMonths(startOfMonth(on), -5),
      to: endOfMonth(on),
    }),
  },
  {
    id: "custom",
    label: "Personalizado",
    versus: "vs. el periodo anterior",
    rangeOn: null,
  },
];

export const DEFAULT_FINANCE_PERIOD: FinancePeriodId = "thisMonth";

export function isFinancePeriodId(value: string): value is FinancePeriodId {
  return FINANCE_PERIODS.some((period) => period.id === value);
}

/** The range typed in the custom period, or null while it is incomplete or reversed. */
export function customRange(from: string, to: string): DateRange | null {
  if (!isIsoDate(from) || !isIsoDate(to) || from > to) return null;
  return { from, to };
}

function monthsSpanned(range: DateRange): number {
  const index = (date: IsoDate) =>
    Number(date.slice(0, 4)) * 12 + Number(date.slice(5, 7));
  return index(range.to) - index(range.from) + 1;
}

function isWholeMonths(range: DateRange): boolean {
  return range.from === startOfMonth(range.from) && range.to === endOfMonth(range.to);
}

/**
 * The period right before `range`, of the same length — what a figure is
 * compared against.
 *
 * Whole calendar months stay whole months: September against August, not
 * against the 30 days before the 1st, which would start on 2 August.
 */
export function previousRangeOf(range: DateRange): DateRange {
  const to = addDays(range.from, -1);
  if (isWholeMonths(range)) {
    return { from: addMonths(range.from, -monthsSpanned(range)), to };
  }
  const days = daysBetween(range.from, range.to) + 1;
  return { from: addDays(range.from, -days), to };
}

/** "15 – 21 sep 2026", "28 sep – 4 oct 2026", "15 dic 2025 – 3 ene 2026". */
export function formatRange(range: DateRange): string {
  const fromYear = range.from.slice(0, 4);
  const toYear = range.to.slice(0, 4);
  const sameMonth = range.from.slice(0, 7) === range.to.slice(0, 7);
  const start = sameMonth
    ? String(Number(range.from.slice(8, 10)))
    : `${formatDayMonth(range.from)}${fromYear === toYear ? "" : ` ${fromYear}`}`;
  return `${start} – ${formatDayMonth(range.to)} ${toYear}`;
}

/** One column of the trend chart: a day or a month. */
export interface TrendPoint {
  readonly key: string;
  /** Short, for the axis: "15" or "sep". */
  readonly label: string;
  /** Full, for the detail: "15 sep" or "sep 2026". */
  readonly title: string;
  readonly income: Money;
  readonly expenses: Money;
  readonly savings: Money;
  readonly profit: Money;
  /** The day or month that contains today. */
  readonly current: boolean;
}

/**
 * Up to this many days the trend goes day by day; past it, month by month.
 *
 * A month fits in 31 columns and shows which days carry the income. Two
 * months of days would be 60 bars too thin to compare, and the question at
 * that scale is already month against month.
 */
export const DAILY_TREND_MAX_DAYS = 31;

export function trendGranularity(range: DateRange): "day" | "month" {
  return daysBetween(range.from, range.to) + 1 <= DAILY_TREND_MAX_DAYS ? "day" : "month";
}

function point(
  records: FinancialRecords,
  slice: DateRange,
  on: IsoDate,
  names: { key: string; label: string; title: string },
): TrendPoint {
  const balance = balanceOver(records, slice, on);
  return {
    ...names,
    income: balance.income,
    expenses: balance.expenses,
    savings: balance.savings,
    profit: balance.profit,
    current: on >= slice.from && on <= slice.to,
  };
}

/** The range split into days or months, oldest first. */
export function trendOver(
  records: FinancialRecords,
  range: DateRange,
  on: IsoDate,
): readonly TrendPoint[] {
  if (trendGranularity(range) === "day") {
    return Array.from({ length: daysBetween(range.from, range.to) + 1 }, (_, i) => {
      const day = addDays(range.from, i);
      return point(records, { from: day, to: day }, on, {
        key: day,
        label: String(Number(day.slice(8, 10))),
        title: formatDayMonth(day),
      });
    });
  }
  return Array.from({ length: monthsSpanned(range) }, (_, i) => {
    const start = addMonths(startOfMonth(range.from), i);
    // The first and last months keep only the part inside the range.
    const slice = {
      from: start < range.from ? range.from : start,
      to: endOfMonth(start) > range.to ? range.to : endOfMonth(start),
    };
    return point(records, slice, on, {
      key: start.slice(0, 7),
      label: monthAbbreviation(start),
      title: `${monthAbbreviation(start)} ${start.slice(0, 4)}`,
    });
  });
}
