import type { IsoDate } from "./calendar";
import type { Money } from "./money";

declare const expenseIdBrand: unique symbol;
export type ExpenseId = string & { readonly [expenseIdBrand]: true };

export function toExpenseId(value: string): ExpenseId {
  return value as ExpenseId;
}

/** A spending category (RF-27). The admin may add or retire them. */
export interface ExpenseCategory {
  readonly id: string;
  /** User-facing name, in Spanish. */
  readonly name: string;
  readonly active: boolean;
}

/** Money leaving the business (RF-26). */
export interface Expense {
  readonly id: ExpenseId;
  readonly categoryId: string;
  /** Concept or justification, in Spanish. */
  readonly description: string;
  readonly amount: Money;
  readonly spentOn: IsoDate;
  readonly recordedBy: string;
}

/**
 * The starting category list from RF-27.
 *
 * Seed data, not a fixed rule: RF-27 lets the administrator extend or retire
 * categories, so once persistence exists this only supplies the initial rows.
 */
export const DEFAULT_EXPENSE_CATEGORIES: readonly ExpenseCategory[] = [
  { id: "payroll", name: "Nómina", active: true },
  { id: "maintenance", name: "Mantenimiento", active: true },
  { id: "utilities", name: "Servicios públicos", active: true },
  { id: "cleaning", name: "Insumos de aseo/antibacteriales", active: true },
  { id: "other", name: "Otro", active: true },
];

export function activeCategories(
  categories: readonly ExpenseCategory[],
): readonly ExpenseCategory[] {
  return categories.filter((category) => category.active);
}

export function findCategory(
  categories: readonly ExpenseCategory[],
  id: string,
): ExpenseCategory | undefined {
  return categories.find((category) => category.id === id);
}
