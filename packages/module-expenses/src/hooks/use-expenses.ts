"use client";

import { useCallback } from "react";
import type { Expense, ExpenseCategory } from "@apexg/core";
import { useCollection, upsertById, useRepositories } from "@apexg/module-kit";
import type { Collection } from "@apexg/module-kit";

export interface UseExpensesResult extends Collection<Expense> {
  readonly create: (draft: Omit<Expense, "id">) => Promise<void>;
}

export function useExpenses(): UseExpensesResult {
  const { expenses } = useRepositories();

  const load = useCallback(() => expenses.list(), [expenses]);
  const collection = useCollection<Expense>(load);
  const { apply } = collection;

  const create = useCallback(
    async (draft: Omit<Expense, "id">) => {
      const saved = await expenses.create(draft);
      apply((current) => [...current, saved]);
    },
    [expenses, apply],
  );

  return { ...collection, create };
}

export interface UseExpenseCategoriesResult extends Collection<ExpenseCategory> {
  /** RF-27: the admin may add a category or retire one. */
  readonly save: (category: ExpenseCategory) => Promise<void>;
}

export function useExpenseCategories(): UseExpenseCategoriesResult {
  const { expenses } = useRepositories();

  const load = useCallback(() => expenses.listCategories(), [expenses]);
  const collection = useCollection<ExpenseCategory>(load);
  const { apply } = collection;

  const save = useCallback(
    async (category: ExpenseCategory) => {
      const saved = await expenses.saveCategory(category);
      apply((current) => upsertById(current, saved));
    },
    [expenses, apply],
  );

  return { ...collection, save };
}
