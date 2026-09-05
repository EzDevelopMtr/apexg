import type { Expense, ExpenseCategory, ExpenseId } from "@apexg/core";
import { DEFAULT_EXPENSE_CATEGORIES, toExpenseId } from "@apexg/core";
import type { ExpenseRepository } from "../repositories";
import { InMemoryStore, newId } from "./in-memory-store";

export class InMemoryExpenseRepository implements ExpenseRepository {
  readonly #expenses: InMemoryStore<ExpenseId, Expense>;
  readonly #categories: InMemoryStore<string, ExpenseCategory>;

  constructor(
    expenses: readonly Expense[] = [],
    categories: readonly ExpenseCategory[] = DEFAULT_EXPENSE_CATEGORIES,
  ) {
    this.#expenses = new InMemoryStore(expenses);
    this.#categories = new InMemoryStore(categories);
  }

  list(): Promise<readonly Expense[]> {
    return this.#expenses.list();
  }

  create(draft: Omit<Expense, "id">): Promise<Expense> {
    return this.#expenses.save({ ...draft, id: toExpenseId(newId()) });
  }

  listCategories(): Promise<readonly ExpenseCategory[]> {
    return this.#categories.list();
  }

  saveCategory(category: ExpenseCategory): Promise<ExpenseCategory> {
    return this.#categories.save(category);
  }
}
