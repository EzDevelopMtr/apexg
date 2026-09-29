import type { Expense, ExpenseCategory, ExpenseId, IsoDate } from "@apexg/core";
import {
  fromApiString,
  isPaymentMethod,
  toApiString,
  toExpenseId,
} from "@apexg/core";
import type { ExpenseEntry, ExpenseRepository } from "../repositories";
import { API_BASE, apiFetch } from "./http-client";
import { toFormData } from "./multipart";

type ApiCategoryState = 1 | 2;

interface ApiExpenseCategoryResult {
  id: string;
  name: string;
  state: ApiCategoryState;
}

interface ApiExpenseResult {
  id: string;
  categoryId: string;
  concept: string;
  amount: string;
  expenseDate: string;
  recordedBy: string;
  paymentMethod: string | null;
  receiptPath: string | null;
}

function fromCategoryResult(row: ApiExpenseCategoryResult): ExpenseCategory {
  return {
    id: row.id,
    name: row.name,
    active: row.state === 1,
  };
}

function fromExpenseResult(row: ApiExpenseResult): Expense {
  return {
    id: toExpenseId(row.id),
    categoryId: row.categoryId,
    description: row.concept,
    amount: fromApiString(row.amount),
    spentOn: row.expenseDate as IsoDate,
    recordedBy: row.recordedBy,
    // Null on expenses recorded before the method was asked (migration 019).
    paymentMethod:
      row.paymentMethod !== null && isPaymentMethod(row.paymentMethod)
        ? row.paymentMethod
        : null,
    receiptPath: row.receiptPath ?? "",
  };
}

export class HttpExpenseRepository implements ExpenseRepository {
  async list(): Promise<readonly Expense[]> {
    const rows = await apiFetch<ApiExpenseResult[]>("/expenses");
    return rows.map(fromExpenseResult);
  }

  async create(draft: ExpenseEntry, receipt?: Blob): Promise<Expense> {
    const fields = {
      categoryId: draft.categoryId,
      concept: draft.description,
      amount: toApiString(draft.amount),
      expenseDate: draft.spentOn,
      paymentMethod: draft.paymentMethod,
    };
    const row = receipt
      ? await apiFetch<ApiExpenseResult>("/expenses", {
          method: "POST",
          formData: toFormData(fields, receipt, "receipt"),
        })
      : await apiFetch<ApiExpenseResult>("/expenses", {
          method: "POST",
          body: fields,
        });
    return fromExpenseResult(row);
  }

  receiptUrl(id: ExpenseId): string {
    return `${API_BASE}/expenses/${id}/receipt`;
  }

  async listCategories(): Promise<readonly ExpenseCategory[]> {
    const rows = await apiFetch<ApiExpenseCategoryResult[]>(
      "/expense-categories",
    );
    return rows.map(fromCategoryResult);
  }

  /**
   * An empty id means the category is new. The caller no longer invents one
   * from the name to signal that — deciding it, and minting the real id, is
   * this layer's job.
   */
  async saveCategory(category: ExpenseCategory): Promise<ExpenseCategory> {
    const row =
      category.id !== ""
        ? await apiFetch<ApiExpenseCategoryResult>(
            `/expense-categories/${category.id}`,
            {
              method: "PATCH",
              body: { name: category.name, state: category.active ? 1 : 2 },
            },
          )
        : await apiFetch<ApiExpenseCategoryResult>("/expense-categories", {
            method: "POST",
            body: { name: category.name },
          });
    return fromCategoryResult(row);
  }
}
