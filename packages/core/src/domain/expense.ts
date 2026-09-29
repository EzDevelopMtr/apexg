import type { IsoDate } from "./calendar";
import { isIsoDate } from "./calendar";
import type { Money } from "./money";
import type { PaymentMethod } from "./payment";
import { isMissingReceipt } from "./receipt";

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
  /**
   * How the money left. Null only on expenses recorded before the method was
   * asked for: their method is unknown, and inventing one would falsify the
   * trail (RNF-07).
   */
  readonly paymentMethod: PaymentMethod | null;
  /** Server-side name of the receipt, or empty when there is none. */
  readonly receiptPath: string;
}

/** What the admin fills in to record an expense. */
export interface ExpenseDraft {
  readonly categoryId: string;
  readonly description: string;
  readonly amountPesos: string;
  readonly spentOn: string;
  readonly paymentMethod: PaymentMethod;
  readonly hasReceipt: boolean;
}

export type ExpenseProblem =
  | "categoryRequired"
  | "descriptionRequired"
  | "amountNotPositive"
  | "dateInvalid"
  | "receiptRequired";

/**
 * Why an expense cannot be recorded yet, or an empty list when it can.
 *
 * The receipt follows the same rule as any other movement of money
 * ({@link isMissingReceipt}): a transfer out of the gym is checked against
 * its screenshot just like one coming in.
 */
export function expenseProblems(
  draft: ExpenseDraft,
): readonly ExpenseProblem[] {
  const problems: ExpenseProblem[] = [];
  if (!draft.categoryId) problems.push("categoryRequired");
  if (!draft.description.trim()) problems.push("descriptionRequired");
  if (!(Number(draft.amountPesos) > 0)) problems.push("amountNotPositive");
  if (!isIsoDate(draft.spentOn)) problems.push("dateInvalid");
  if (isMissingReceipt(draft.paymentMethod, draft.hasReceipt)) {
    problems.push("receiptRequired");
  }
  return problems;
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
