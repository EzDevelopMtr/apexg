import type { Expense, ExpenseCategory, IsoDate } from "@apexg/core";
import { fromApiString, toApiString, toExpenseId } from "@apexg/core";
import type { ExpenseRepository } from "../repositories";
import { apiFetch } from "./http-client";

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
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
    // The backend records `created_by` (a user id) but `ExpenseResult`
    // does not expose it — nothing on this side to resolve it from.
    // `ExpenseList` shows this column, so it will read blank until the
    // backend's read DTO carries who logged the expense.
    recordedBy: "",
  };
}

export class HttpExpenseRepository implements ExpenseRepository {
  async list(): Promise<readonly Expense[]> {
    const rows = await apiFetch<ApiExpenseResult[]>("/expenses");
    return rows.map(fromExpenseResult);
  }

  async create(draft: Omit<Expense, "id">): Promise<Expense> {
    const row = await apiFetch<ApiExpenseResult>("/expenses", {
      method: "POST",
      body: {
        categoryId: draft.categoryId,
        concept: draft.description,
        amount: toApiString(draft.amount),
        expenseDate: draft.spentOn,
      },
    });
    return fromExpenseResult(row);
  }

  async listCategories(): Promise<readonly ExpenseCategory[]> {
    const rows = await apiFetch<ApiExpenseCategoryResult[]>("/expense-categories");
    return rows.map(fromCategoryResult);
  }

  /**
   * `CategoryPanel` gives a NEW category a client-generated slug id (e.g.
   * "publicidad"), not the backend's real UUID — there is no empty-id
   * sentinel here like Membership Types has. A slug is never a valid UUID,
   * so that alone tells create and update apart without an extra read; the
   * backend-assigned UUID this returns is what later edits pass back in.
   */
  async saveCategory(category: ExpenseCategory): Promise<ExpenseCategory> {
    const row = UUID_PATTERN.test(category.id)
      ? await apiFetch<ApiExpenseCategoryResult>(`/expense-categories/${category.id}`, {
          method: "PATCH",
          body: { name: category.name, state: category.active ? 1 : 2 },
        })
      : await apiFetch<ApiExpenseCategoryResult>("/expense-categories", {
          method: "POST",
          body: { name: category.name },
        });
    return fromCategoryResult(row);
  }
}
