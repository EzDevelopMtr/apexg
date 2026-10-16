import { and, eq, gte, lte, sql } from 'drizzle-orm';
import type { AnyColumn } from 'drizzle-orm';

import type { Database } from '../database/database.types.js';
import {
  dayPasses,
  expenses,
  payments,
  productSales,
  trainerCommissions,
} from '../database/schema/schema.js';
import { APP_TIMEZONE } from '../shared/date.util.js';
import { toCents } from '../shared/money-amount.util.js';

/**
 * Mismas fuentes que Finanzas en el front (`balanceOver` de core), para que
 * la API y la pantalla nunca den cifras distintas. Ingresos: mensualidades,
 * ventas de productos y pases de día. Egresos: los registrados y las
 * comisiones ya pagadas, por el día en que se le pagó al entrenador.
 *
 * Los `TIMESTAMPTZ` se agrupan por día calendario LOCAL (`AT TIME ZONE`),
 * no UTC — mismo cuidado que `shared/date.util.ts`. `expenses.expense_date`
 * ya es `DATE` y no necesita esa conversión.
 */
export async function sumIncomeAndExpenses(
  db: Database,
  companyId: string,
  from: string,
  to: string,
): Promise<{ incomeCents: number; expensesCents: number }> {
  const onLocalDay = (column: AnyColumn) =>
    sql`(${column} AT TIME ZONE ${APP_TIMEZONE})::date BETWEEN ${from} AND ${to}`;
  const total = async (query: Promise<{ total: string }[]>) =>
    toCents((await query)[0]?.total ?? '0');
  const sumOf = (column: AnyColumn) => sql<string>`COALESCE(SUM(${column}), 0)`;

  const [fromPayments, fromSales, fromPasses, spent, paidToTrainers] = await Promise.all([
    total(
      db
        .select({ total: sumOf(payments.amount) })
        .from(payments)
        .where(and(eq(payments.companyId, companyId), onLocalDay(payments.paidAt))),
    ),
    total(
      db
        .select({ total: sumOf(productSales.amount) })
        .from(productSales)
        .where(and(eq(productSales.companyId, companyId), onLocalDay(productSales.soldAt))),
    ),
    total(
      db
        .select({ total: sumOf(dayPasses.amount) })
        .from(dayPasses)
        .where(and(eq(dayPasses.companyId, companyId), onLocalDay(dayPasses.soldAt))),
    ),
    total(
      db
        .select({ total: sumOf(expenses.amount) })
        .from(expenses)
        .where(
          and(
            eq(expenses.companyId, companyId),
            gte(expenses.expenseDate, from),
            lte(expenses.expenseDate, to),
          ),
        ),
    ),
    total(
      db
        .select({ total: sumOf(trainerCommissions.trainerAmount) })
        .from(trainerCommissions)
        .where(
          and(
            eq(trainerCommissions.companyId, companyId),
            eq(trainerCommissions.settled, true),
            onLocalDay(trainerCommissions.settledAt),
          ),
        ),
    ),
  ]);

  return {
    incomeCents: fromPayments + fromSales + fromPasses,
    expensesCents: spent + paidToTrainers,
  };
}
