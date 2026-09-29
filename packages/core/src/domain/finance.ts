import type { DateRange, IsoDate } from "./calendar";
import { isWithin, previousMonth, rangeFor, startOfMonth } from "./calendar";
import type { Client } from "./client";
import type { DayPass } from "./day-pass";
import { resolveStatus } from "./client";
import type { Expense } from "./expense";
import type { Money } from "./money";
import { ZERO, add, subtract } from "./money";
import type { Payment } from "./payment";
import type { ProductSale } from "./product-sale";
import type { SavingsContribution } from "./savings";

export type BalancePeriod = "day" | "week" | "month";

/**
 * The records every financial figure is computed from.
 *
 * Grouped because they always travel together: a balance, a comparison and the
 * daily log all need the same collections. Income has three sources —
 * membership payments, product sales (RF-28/29) and day passes sold to
 * visitors — counted separately so the daily log can show where the money
 * came from, not just the total.
 */
export interface FinancialRecords {
  readonly payments: readonly Payment[];
  readonly productSales: readonly ProductSale[];
  readonly dayPasses: readonly DayPass[];
  readonly expenses: readonly Expense[];
  readonly clients: readonly Client[];
  /**
   * Lo apartado en bolsillos de ahorro. Baja la utilidad igual que un egreso:
   * es plata comprometida con un destino, no ganancia disponible.
   */
  readonly savings: readonly SavingsContribution[];
}

/** Income against outgoings for a period (RF-31). */
export interface Balance {
  readonly range: DateRange;
  readonly income: Money;
  readonly expenses: Money;
  /** Lo apartado a bolsillos en el periodo. Se muestra aparte de `expenses`. */
  readonly savings: Money;
  readonly profit: Money;
  readonly activeClients: number;
  readonly overdueClients: number;
}

function sumIn<T>(
  records: readonly T[],
  range: DateRange,
  dateOf: (record: T) => IsoDate,
  amountOf: (record: T) => Money,
): Money {
  return records
    .filter((record) => isWithin(dateOf(record), range))
    .reduce<Money>(
      (running, record) => (running + amountOf(record)) as Money,
      ZERO,
    );
}

/**
 * The balance for the day, week or month containing `on` (RF-31).
 *
 * Client counts are **derived** from the expiry date, not read from the stored
 * status (RF-33). Reading the stored value would report a lapsed membership as
 * active until something happened to rewrite the record.
 */
export function calculateBalance(
  records: FinancialRecords,
  period: BalancePeriod,
  on: IsoDate,
): Balance {
  return balanceOver(records, rangeFor(period, on), on);
}

/**
 * The balance for any range — a week, a month or dates the owner picked.
 *
 * `on` is only for the client counts, which describe a moment rather than a
 * period: how many are active today, not "during" the range.
 */
export function balanceOver(
  records: FinancialRecords,
  range: DateRange,
  on: IsoDate,
): Balance {

  const income = add(
    add(
      sumIn(records.payments, range, (p) => p.paidOn, (p) => p.amount),
      sumIn(records.productSales, range, (s) => s.soldOn, (s) => s.amount),
    ),
    sumIn(records.dayPasses, range, (d) => d.soldOn, (d) => d.amount),
  );
  const spent = sumIn(
    records.expenses,
    range,
    (e) => e.spentOn,
    (e) => e.amount,
  );
  // Aparte de los egresos, no sumado a ellos: un egreso ya se gastó y un
  // ahorro sigue en caja. Ambos salen de la utilidad, pero quien lee el
  // balance necesita distinguirlos.
  const saved = sumIn(
    records.savings,
    range,
    (c) => c.contributedOn,
    (c) => c.amount,
  );

  const statuses = records.clients.map((client) => resolveStatus(client, on));

  return {
    range,
    income,
    expenses: spent,
    savings: saved,
    profit: subtract(income, add(spent, saved)),
    activeClients: statuses.filter((status) => status === "active").length,
    overdueClients: statuses.filter((status) => status === "overdue").length,
  };
}

export interface MonthComparison {
  readonly current: Balance;
  readonly previous: Balance;
  /** Change in profit, as a percentage of the previous month. */
  readonly profitChangePercent: number;
}

/** This month against the last one (RF-32, RF-35). */
export function compareWithPreviousMonth(
  records: FinancialRecords,
  on: IsoDate,
): MonthComparison {
  const current = calculateBalance(records, "month", on);
  const previous = calculateBalance(
    records,
    "month",
    previousMonth(startOfMonth(on)),
  );

  return {
    current,
    previous,
    profitChangePercent: percentChange(previous.profit, current.profit),
  };
}

/**
 * Percentage change from `before` to `after`.
 *
 * Growth from zero has no defined percentage, so it reports 0 for "nothing
 * changed" and 100 for "something appeared where there was nothing" rather
 * than dividing by zero.
 */
export function percentChange(before: Money, after: Money): number {
  if (before === 0) return after === 0 ? 0 : 100;
  return Math.round(((after - before) / Math.abs(before)) * 100);
}

/**
 * Percentage change from `before` to `after`, or `null` when there is no base
 * to compare against.
 *
 * For display: "+100% vs. mes anterior" after a month at zero reads as
 * doubling, when the honest answer is that there is nothing to compare with.
 */
export function comparableChange(before: Money, after: Money): number | null {
  return before === 0 ? null : percentChange(before, after);
}

/** An observation recorded when closing a month (RF-32). */
export interface MonthlyClosure {
  /** The month being closed, as `YYYY-MM`. */
  readonly month: string;
  readonly notes: string;
  readonly closedBy: string;
  readonly closedOn: IsoDate;
}

/** An entry in the day's logbook (RF-34). */
export interface DailyLogNote {
  readonly id: string;
  readonly on: IsoDate;
  readonly text: string;
  readonly recordedBy: string;
}

/**
 * What the daily logbook shows for one day (RF-34).
 *
 * `income` splits by source so the day's total is never a black box: a
 * receptionist can see whether it came from membership payments, product
 * sales or day passes.
 */
export interface DailyLog {
  readonly on: IsoDate;
  readonly income: Money;
  readonly incomeFromPayments: Money;
  readonly incomeFromSales: Money;
  readonly incomeFromDayPasses: Money;
  readonly newClients: readonly Client[];
  readonly notes: readonly DailyLogNote[];
}

export function buildDailyLog(
  records: Pick<
    FinancialRecords,
    "payments" | "clients" | "productSales" | "dayPasses"
  >,
  notes: readonly DailyLogNote[],
  on: IsoDate,
): DailyLog {
  const range = rangeFor("day", on);
  const incomeFromPayments = sumIn(
    records.payments,
    range,
    (p) => p.paidOn,
    (p) => p.amount,
  );
  const incomeFromSales = sumIn(
    records.productSales,
    range,
    (s) => s.soldOn,
    (s) => s.amount,
  );

  const incomeFromDayPasses = sumIn(
    records.dayPasses,
    range,
    (d) => d.soldOn,
    (d) => d.amount,
  );

  return {
    on,
    income: add(add(incomeFromPayments, incomeFromSales), incomeFromDayPasses),
    incomeFromPayments,
    incomeFromSales,
    incomeFromDayPasses,
    newClients: records.clients.filter((client) => client.startDate === on),
    notes: notes.filter((note) => note.on === on),
  };
}
