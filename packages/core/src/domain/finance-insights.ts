import type { DateRange, IsoDate } from "./calendar";
import { isWithin } from "./calendar";
import type { Client, ClientId } from "./client";
import { isExpiringSoon, resolveStatus } from "./client";
import type { Balance, FinancialRecords } from "./finance";
import type { Expense } from "./expense";
import type { MembershipTypeId } from "./membership";
import type { Money } from "./money";
import { ZERO, add } from "./money";
import type { Payment } from "./payment";
import { cyclesWithBalance } from "./payment";
import type { Commission } from "./trainer";

/**
 * Qué parte de cada peso que entra queda como utilidad, en porcentaje.
 *
 * `null` sin ingresos: un margen sobre cero no existe, y mostrar "0 %" o
 * "-100 %" diría algo que no pasó.
 */
export function profitMargin(balance: Balance): number | null {
  if (balance.income <= 0) return null;
  return Math.round((balance.profit / balance.income) * 100);
}

/** Una barra de un desglose. */
export interface Share {
  readonly key: string;
  readonly label: string;
  readonly amount: Money;
  /** El mismo rubro el mes anterior, cuando se compara. */
  readonly previous?: Money;
}

/** Clave del rubro de venta de productos en el desglose de ingresos. */
export const PRODUCT_SALES_KEY = "productSales";

/** Clave del rubro de pases de día en el desglose de ingresos. */
export const DAY_PASSES_KEY = "dayPasses";

function sumBy<T>(
  items: readonly T[],
  keyOf: (item: T) => string,
  amountOf: (item: T) => Money,
): Map<string, Money> {
  const totals = new Map<string, Money>();
  for (const item of items) {
    const key = keyOf(item);
    totals.set(key, add(totals.get(key) ?? ZERO, amountOf(item)));
  }
  return totals;
}

const byAmount = (a: Share, b: Share) => b.amount - a.amount;

/**
 * De dónde salió la plata del periodo: cada plan, la venta de productos y los
 * pases de día.
 *
 * Por plan y no por cliente: la decisión que se toma con esto es de precios y
 * promociones —qué plan empujar, cuál sobra—, y esa se toma por plan.
 */
export function incomeBySource(
  records: Pick<FinancialRecords, "payments" | "productSales" | "dayPasses">,
  range: DateRange,
  planNameOf: (id: MembershipTypeId) => string,
): readonly Share[] {
  const payments = records.payments.filter((p) => isWithin(p.paidOn, range));
  const byPlan = sumBy(payments, (p) => p.membershipTypeId, (p) => p.amount);
  const shares: Share[] = [...byPlan].map(([key, amount]) => ({
    key,
    label: planNameOf(key as MembershipTypeId),
    amount,
  }));

  const sales = records.productSales
    .filter((sale) => isWithin(sale.soldOn, range))
    .reduce<Money>((running, sale) => add(running, sale.amount), ZERO);
  if (sales > 0) {
    shares.push({ key: PRODUCT_SALES_KEY, label: "Venta de productos", amount: sales });
  }
  // Aparte del plan "Día" y no sumado a él: lo que esta barra responde es
  // cuánto dejan los visitantes, que no son clientes, y eso decide si vale la
  // pena ofrecerles un plan.
  const passes = records.dayPasses
    .filter((pass) => isWithin(pass.soldOn, range))
    .reduce<Money>((running, pass) => add(running, pass.amount), ZERO);
  if (passes > 0) {
    shares.push({ key: DAY_PASSES_KEY, label: "Pases de día", amount: passes });
  }
  return shares.sort(byAmount);
}

/**
 * En qué se fue la plata del periodo, junto a lo mismo el mes anterior.
 *
 * La comparación es lo que vuelve útil el desglose: "servicios $300.000" no
 * dice si es mucho; "servicios $300.000, el mes pasado $180.000" sí.
 */
export function expensesByCategory(
  expenses: readonly Expense[],
  range: DateRange,
  previousRange: DateRange,
  categoryNameOf: (id: string) => string,
): readonly Share[] {
  const current = sumBy(
    expenses.filter((e) => isWithin(e.spentOn, range)),
    (e) => e.categoryId,
    (e) => e.amount,
  );
  const previous = sumBy(
    expenses.filter((e) => isWithin(e.spentOn, previousRange)),
    (e) => e.categoryId,
    (e) => e.amount,
  );
  const keys = new Set([...current.keys(), ...previous.keys()]);

  return [...keys]
    .map((key) => ({
      key,
      label: categoryNameOf(key),
      amount: current.get(key) ?? ZERO,
      previous: previous.get(key) ?? ZERO,
    }))
    .sort(byAmount);
}

/** Lo que un cliente debe de un abono sin completar. */
export interface Receivable {
  readonly clientId: ClientId;
  readonly amount: Money;
  /** Día del último abono, para saber desde cuándo se debe. */
  readonly since: IsoDate;
}

/** Los saldos vivos de abonos, del más grande al más chico. */
export function receivables(payments: readonly Payment[]): readonly Receivable[] {
  return cyclesWithBalance(payments)
    .map((payment) => ({
      clientId: payment.clientId,
      amount: payment.balanceAfter,
      since: payment.paidOn,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export function totalOf(items: readonly { readonly amount: Money }[]): Money {
  return items.reduce<Money>((running, item) => add(running, item.amount), ZERO);
}

/** Lo que el gimnasio debe a sus entrenadores y no ha pagado. */
export function pendingCommissions(commissions: readonly Commission[]): Money {
  return totalOf(commissions.filter((commission) => !commission.settled));
}

/** Un grupo de clientes que representa plata por entrar o en riesgo. */
export interface ClientGroup {
  readonly clients: readonly Client[];
  /** Lo que valdría renovarlos a todos al precio de su plan. */
  readonly value: Money;
}

export interface RenewalOutlook {
  /** Vencen en los próximos `days` días: renovaciones por cerrar. */
  readonly expiring: ClientGroup;
  /** Ya vencidos: ingreso que se está perdiendo. */
  readonly overdue: ClientGroup;
  readonly activeCount: number;
}

/**
 * La plata que viene y la que se está yendo, por clientes.
 *
 * Es la parte del tablero que dice a quién llamar: los que vencen pronto son
 * ingreso probable si alguien los contacta, y los que están en mora, ingreso
 * que se pierde cada día que pasa.
 */
export function renewalOutlook(
  clients: readonly Client[],
  priceOf: (id: MembershipTypeId) => Money | undefined,
  on: IsoDate,
  days = 30,
): RenewalOutlook {
  const group = (members: readonly Client[]): ClientGroup => ({
    clients: [...members].sort((a, b) =>
      a.expirationDate.localeCompare(b.expirationDate),
    ),
    value: members.reduce<Money>(
      (running, client) => add(running, priceOf(client.membershipTypeId) ?? ZERO),
      ZERO,
    ),
  });

  return {
    expiring: group(clients.filter((client) => isExpiringSoon(client, on, days))),
    overdue: group(clients.filter((client) => resolveStatus(client, on) === "overdue")),
    activeCount: clients.filter((client) => resolveStatus(client, on) === "active")
      .length,
  };
}
