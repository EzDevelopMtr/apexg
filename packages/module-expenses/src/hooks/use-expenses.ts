"use client";

import { useCallback } from "react";
import type { Expense, ExpenseCategory, ExpenseId } from "@apexg/core";
import type { ExpenseEntry } from "@apexg/data";
import { useCollection, upsertById, useRepositories } from "@apexg/module-kit";
import type { Collection } from "@apexg/module-kit";

export interface UseExpensesResult extends Collection<Expense> {
  readonly create: (draft: ExpenseEntry, receipt?: Blob) => Promise<void>;
  /** Where to open an expense's receipt. */
  readonly receiptUrl: (id: ExpenseId) => string;
}

export function useExpenses(): UseExpensesResult {
  const { expenses } = useRepositories();

  const load = useCallback(() => expenses.list(), [expenses]);
  const collection = useCollection<Expense>(load);
  const { apply } = collection;

  const create = useCallback(
    async (draft: ExpenseEntry, receipt?: Blob) => {
      const saved = await expenses.create(draft, receipt);
      apply((current) => [...current, saved]);
    },
    [expenses, apply],
  );

  const receiptUrl = useCallback(
    (id: ExpenseId) => expenses.receiptUrl(id),
    [expenses],
  );

  return { ...collection, create, receiptUrl };
}

export interface UseExpenseCategoriesResult extends Collection<ExpenseCategory> {
  /** RF-27: the admin may add a category or retire one. */
  readonly save: (category: ExpenseCategory) => Promise<void>;
  /** Creates one from just its name; the id comes back from the backend. */
  readonly create: (name: string) => Promise<void>;
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

  /** An empty id is how the data layer is told this one is new (see saveCategory). */
  const create = useCallback(
    (name: string) => save({ id: "", name, active: true }),
    [save],
  );

  return { ...collection, save, create };
}
