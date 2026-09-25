import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, gte, lte } from 'drizzle-orm';

import { DATABASE } from '../database/database.constants.js';
import type { Database } from '../database/database.types.js';
import { expenses } from '../database/schema/schema.js';
import { assertDefined } from '../shared/assert-defined.util.js';
import {
  AuthorLookupService,
  authorName,
} from '../shared/author-lookup.service.js';
import { today } from '../shared/date.util.js';

import type { CreateExpenseDto } from './create-expense.dto.js';
import { ExpenseCategoryService } from './expense-category.service.js';
import type { UpdateExpenseDto } from './update-expense.dto.js';
import type { ExpenseResult, ListExpensesFilter } from './expenses.types.js';

/** RF-26. La gestión del catálogo de categorías (RF-27) vive en `ExpenseCategoryService`. */
@Injectable()
export class ExpensesService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly categories: ExpenseCategoryService,
    private readonly authors: AuthorLookupService,
  ) {}

  async create(companyId: string, userId: string, input: CreateExpenseDto): Promise<ExpenseResult> {
    const category = await this.categories.load(companyId, input.categoryId);

    const [row] = await this.db
      .insert(expenses)
      .values({
        companyId,
        categoryId: category.id,
        concept: input.concept,
        amount: input.amount,
        expenseDate: input.expenseDate ?? today(),
        createdBy: userId,
      })
      .returning();

    return this.toResult(
      assertDefined(row, 'INSERT into expenses did not return a row.'),
      category.name,
      await this.authors.nameOf(userId),
    );
  }

  async findAll(companyId: string, filter: ListExpensesFilter): Promise<ExpenseResult[]> {
    const conditions = [eq(expenses.companyId, companyId)];
    if (filter.categoryId !== undefined) {
      conditions.push(eq(expenses.categoryId, filter.categoryId));
    }
    if (filter.from !== undefined) {
      conditions.push(gte(expenses.expenseDate, filter.from));
    }
    if (filter.to !== undefined) {
      conditions.push(lte(expenses.expenseDate, filter.to));
    }

    const rows = await this.db
      .select()
      .from(expenses)
      .where(and(...conditions))
      .orderBy(expenses.expenseDate);

    const categories = await this.categories.list(companyId);
    const nameById = new Map(categories.map((category) => [category.id, category.name]));

    const authors = await this.authors.namesOf(rows.map((row) => row.createdBy));
    return rows.map((row) =>
      this.toResult(
        row,
        nameById.get(row.categoryId) ?? '—',
        authorName(authors, row.createdBy),
      ),
    );
  }

  async findOne(companyId: string, id: string): Promise<ExpenseResult> {
    const [row] = await this.db
      .select()
      .from(expenses)
      .where(and(eq(expenses.id, id), eq(expenses.companyId, companyId)));
    if (!row) {
      throw new NotFoundException('El egreso no existe.');
    }
    const category = await this.categories.load(companyId, row.categoryId);
    return this.toResult(
      row,
      category.name,
      await this.authors.nameOf(row.createdBy),
    );
  }

  async update(companyId: string, id: string, input: UpdateExpenseDto): Promise<ExpenseResult> {
    await this.findOne(companyId, id);
    if (input.categoryId !== undefined) {
      await this.categories.load(companyId, input.categoryId);
    }

    const patch: Partial<typeof expenses.$inferInsert> = {};
    if (input.categoryId !== undefined) patch.categoryId = input.categoryId;
    if (input.concept !== undefined) patch.concept = input.concept;
    if (input.amount !== undefined) patch.amount = input.amount;
    if (input.expenseDate !== undefined) patch.expenseDate = input.expenseDate;

    if (Object.keys(patch).length > 0) {
      await this.db
        .update(expenses)
        .set({ ...patch, updatedAt: new Date().toISOString() })
        .where(eq(expenses.id, id));
    }

    return this.findOne(companyId, id);
  }

  async remove(companyId: string, id: string): Promise<void> {
    await this.findOne(companyId, id);
    await this.db
      .delete(expenses)
      .where(and(eq(expenses.id, id), eq(expenses.companyId, companyId)));
  }

  private toResult(
    row: typeof expenses.$inferSelect,
    categoryName: string,
    recordedBy: string,
  ): ExpenseResult {
    return {
      id: row.id,
      categoryId: row.categoryId,
      categoryName,
      concept: row.concept,
      amount: row.amount,
      expenseDate: row.expenseDate,
      recordedBy,
    };
  }
}
