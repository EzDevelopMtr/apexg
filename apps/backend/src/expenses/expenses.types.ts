/** Tipos del módulo Egresos (RF-26, RF-27). Montos como string — NUMERIC. */

export type ExpenseCategoryState = 1 | 2;

export interface ExpenseCategoryResult {
  id: string;
  name: string;
  description: string | null;
  state: ExpenseCategoryState;
}

export interface ExpenseResult {
  id: string;
  categoryId: string;
  categoryName: string;
  concept: string;
  amount: string;
  expenseDate: string;
  /** Quién lo registró, para el rastro de RNF-07. "—" si es anterior. */
  recordedBy: string;
}

export interface ListExpensesFilter {
  categoryId?: string;
  from?: string;
  to?: string;
}
