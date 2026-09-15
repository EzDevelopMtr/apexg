import { BadRequestException, ConflictException, Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';

// Value import: constructor-injected (see the note in access-token.guard.ts).
import { ClientOverdueSyncService } from '../clients/client-overdue-sync.service.js';
import { DATABASE } from '../database/database.constants.js';
import type { Database } from '../database/database.types.js';
import { clients, expenses, monthlyClosures, payments } from '../database/schema/schema.js';
import { assertDefined } from '../shared/assert-defined.util.js';
import { APP_TIMEZONE, toLocalDate } from '../shared/date.util.js';
import { fromCents, toCents } from '../shared/money-amount.util.js';
import { PG_UNIQUE_VIOLATION, pgErrorCode } from '../shared/pg-error.util.js';

import type { CreateMonthlyClosureDto } from './create-monthly-closure.dto.js';
import type {
  BalanceSummary,
  FinanceDashboard,
  MonthlyClosureResult,
  MonthlySummary,
} from './finance.types.js';

type MonthlyClosureRow = typeof monthlyClosures.$inferSelect;

@Injectable()
export class FinanceService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly overdueSync: ClientOverdueSyncService,
  ) {}

  /** RF-31: balance de un rango arbitrario (día, semana o mes según lo que pida el cliente). */
  async getBalance(companyId: string, from: string, to: string): Promise<BalanceSummary> {
    if (from > to) {
      throw new BadRequestException('"from" no puede ser posterior a "to".');
    }

    const { incomeCents, expensesCents } = await this.sumIncomeAndExpenses(companyId, from, to);
    return {
      from,
      to,
      income: fromCents(incomeCents),
      expenses: fromCents(expensesCents),
      net: fromCents(incomeCents - expensesCents),
    };
  }

  /** RF-32: utilidad del mes y su variación frente al mes calendario anterior. */
  async getMonthlySummary(
    companyId: string,
    year: number,
    month: number,
  ): Promise<MonthlySummary> {
    const current = await this.sumIncomeAndExpenses(companyId, ...monthRange(year, month));
    const currentProfitCents = current.incomeCents - current.expensesCents;

    const { year: previousYear, month: previousMonth } = previousCalendarMonth(year, month);
    const previous = await this.sumIncomeAndExpenses(
      companyId,
      ...monthRange(previousYear, previousMonth),
    );
    const previousProfitCents = previous.incomeCents - previous.expensesCents;

    return {
      year,
      month,
      income: fromCents(current.incomeCents),
      expenses: fromCents(current.expensesCents),
      profit: fromCents(currentProfitCents),
      previousMonth: {
        year: previousYear,
        month: previousMonth,
        profit: fromCents(previousProfitCents),
      },
      profitChangePercent: percentChange(previousProfitCents, currentProfitCents),
    };
  }

  /** RF-33, RF-35 [PROPUESTA]. */
  async getDashboard(companyId: string): Promise<FinanceDashboard> {
    await this.overdueSync.run(companyId);

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const current = await this.sumIncomeAndExpenses(companyId, ...monthRange(currentYear, currentMonth));

    const { year: previousYear, month: previousMonth } = previousCalendarMonth(
      currentYear,
      currentMonth,
    );
    const previous = await this.sumIncomeAndExpenses(
      companyId,
      ...monthRange(previousYear, previousMonth),
    );

    const [activeRow] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(clients)
      .where(and(eq(clients.companyId, companyId), eq(clients.state, 1)));
    const [overdueRow] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(clients)
      .where(and(eq(clients.companyId, companyId), eq(clients.state, 3)));

    return {
      monthIncome: fromCents(current.incomeCents),
      activeClients: activeRow?.count ?? 0,
      overdueClients: overdueRow?.count ?? 0,
      previousMonthIncome: fromCents(previous.incomeCents),
      incomeChangePercent: percentChange(previous.incomeCents, current.incomeCents),
    };
  }

  async closeMonth(
    companyId: string,
    userId: string,
    input: CreateMonthlyClosureDto,
  ): Promise<MonthlyClosureResult> {
    try {
      const [row] = await this.db
        .insert(monthlyClosures)
        .values({
          companyId,
          year: input.year,
          month: input.month,
          observations: input.observations ?? null,
          closedBy: userId,
          closedAt: new Date().toISOString(),
        })
        .returning();
      return this.toClosureResult(
        assertDefined(row, 'INSERT into monthly_closures did not return a row.'),
      );
    } catch (error) {
      if (pgErrorCode(error) === PG_UNIQUE_VIOLATION) {
        throw new ConflictException(`El mes ${input.month}/${input.year} ya fue cerrado.`);
      }
      throw error;
    }
  }

  async listClosures(companyId: string): Promise<MonthlyClosureResult[]> {
    const rows = await this.db
      .select()
      .from(monthlyClosures)
      .where(eq(monthlyClosures.companyId, companyId))
      .orderBy(desc(monthlyClosures.year), desc(monthlyClosures.month));
    return rows.map((row) => this.toClosureResult(row));
  }

  /**
   * `payments.paid_at` es `TIMESTAMPTZ`: se agrupa por día calendario LOCAL
   * (`AT TIME ZONE`), no UTC — mismo cuidado que `shared/date.util.ts`, para
   * no repetir el bug ya corregido en Pagos. `expenses.expense_date` ya es
   * `DATE` (sin hora), por eso no necesita esa conversión.
   */
  private async sumIncomeAndExpenses(
    companyId: string,
    from: string,
    to: string,
  ): Promise<{ incomeCents: number; expensesCents: number }> {
    const [incomeRow] = await this.db
      .select({ total: sql<string>`COALESCE(SUM(${payments.amount}), 0)` })
      .from(payments)
      .where(
        and(
          eq(payments.companyId, companyId),
          sql`(${payments.paidAt} AT TIME ZONE ${APP_TIMEZONE})::date BETWEEN ${from} AND ${to}`,
        ),
      );

    const [expensesRow] = await this.db
      .select({ total: sql<string>`COALESCE(SUM(${expenses.amount}), 0)` })
      .from(expenses)
      .where(
        and(
          eq(expenses.companyId, companyId),
          gte(expenses.expenseDate, from),
          lte(expenses.expenseDate, to),
        ),
      );

    return {
      incomeCents: toCents(incomeRow?.total ?? '0'),
      expensesCents: toCents(expensesRow?.total ?? '0'),
    };
  }

  private toClosureResult(row: MonthlyClosureRow): MonthlyClosureResult {
    return {
      id: row.id,
      year: row.year,
      month: row.month,
      observations: row.observations,
      closedBy: row.closedBy,
      closedAt: row.closedAt,
    };
  }
}

/** Primer y último día del mes, como `YYYY-MM-DD` local. */
function monthRange(year: number, month: number): [from: string, to: string] {
  const first = new Date(year, month - 1, 1);
  const last = new Date(year, month, 0);
  return [toLocalDate(first), toLocalDate(last)];
}

/**
 * Mes calendario anterior, dejando que `Date` resuelva el rollover de año
 * (enero - 1 = diciembre del año anterior) en vez de un `if` a mano —
 * ese `if` fue justo el bug que ya se corrigió una vez en el frontend.
 */
function previousCalendarMonth(year: number, month: number): { year: number; month: number } {
  const previous = new Date(year, month - 2, 1);
  return { year: previous.getFullYear(), month: previous.getMonth() + 1 };
}

/** null cuando `previousCents` es 0: no hay base para expresar un cambio en %. */
function percentChange(previousCents: number, currentCents: number): number | null {
  if (previousCents === 0) {
    return null;
  }
  const change = ((currentCents - previousCents) / Math.abs(previousCents)) * 100;
  return Math.round(change * 100) / 100;
}
