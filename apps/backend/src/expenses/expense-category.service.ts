import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { DATABASE } from '../database/database.constants.js';
import type { Database } from '../database/database.types.js';
import { expenseCategories } from '../database/schema/schema.js';
import { assertDefined } from '../shared/assert-defined.util.js';
import {
  PG_FOREIGN_KEY_VIOLATION,
  PG_UNIQUE_VIOLATION,
  pgErrorCode,
} from '../shared/pg-error.util.js';

import type { CreateExpenseCategoryDto } from './create-expense-category.dto.js';
import type { UpdateExpenseCategoryDto } from './update-expense-category.dto.js';
import type { ExpenseCategoryResult, ExpenseCategoryState } from './expenses.types.js';

type ExpenseCategoryRow = typeof expenseCategories.$inferSelect;

/** RF-27. Su propia clase: `ExpensesService` la usa para resolver la
 *  categoría de un egreso, pero administrar el catálogo es una
 *  responsabilidad aparte de registrar egresos contra él. */
@Injectable()
export class ExpenseCategoryService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async create(
    companyId: string,
    input: CreateExpenseCategoryDto,
  ): Promise<ExpenseCategoryResult> {
    try {
      const [row] = await this.db
        .insert(expenseCategories)
        .values({ companyId, name: input.name, description: input.description ?? null })
        .returning();
      return this.toResult(
        assertDefined(row, 'INSERT into expense_categories did not return a row.'),
      );
    } catch (error) {
      if (pgErrorCode(error) === PG_UNIQUE_VIOLATION) {
        throw new ConflictException('Ya existe una categoría con ese nombre.');
      }
      throw error;
    }
  }

  async list(companyId: string): Promise<ExpenseCategoryResult[]> {
    const rows = await this.db
      .select()
      .from(expenseCategories)
      .where(eq(expenseCategories.companyId, companyId))
      .orderBy(expenseCategories.name);
    return rows.map((row) => this.toResult(row));
  }

  async update(
    companyId: string,
    id: string,
    input: UpdateExpenseCategoryDto,
  ): Promise<ExpenseCategoryResult> {
    await this.load(companyId, id);

    const patch: Partial<typeof expenseCategories.$inferInsert> = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.description !== undefined) patch.description = input.description;
    if (input.state !== undefined) patch.state = input.state;

    try {
      if (Object.keys(patch).length > 0) {
        await this.db
          .update(expenseCategories)
          .set({ ...patch, updatedAt: new Date().toISOString() })
          .where(eq(expenseCategories.id, id));
      }
    } catch (error) {
      if (pgErrorCode(error) === PG_UNIQUE_VIOLATION) {
        throw new ConflictException('Ya existe una categoría con ese nombre.');
      }
      throw error;
    }

    return this.toResult(await this.load(companyId, id));
  }

  /** RF-27 "eliminar": DELETE real. `expenses.category_id` la protege sin
   *  ON DELETE CASCADE — Postgres rechaza si hay egresos con esa categoría. */
  async remove(companyId: string, id: string): Promise<void> {
    await this.load(companyId, id);
    try {
      await this.db
        .delete(expenseCategories)
        .where(and(eq(expenseCategories.id, id), eq(expenseCategories.companyId, companyId)));
    } catch (error) {
      if (pgErrorCode(error) === PG_FOREIGN_KEY_VIOLATION) {
        throw new ConflictException(
          'No se puede eliminar: hay egresos registrados con esta categoría. Desactívala en su lugar (PATCH state=2).',
        );
      }
      throw error;
    }
  }

  async load(companyId: string, id: string): Promise<ExpenseCategoryRow> {
    const [row] = await this.db
      .select()
      .from(expenseCategories)
      .where(and(eq(expenseCategories.id, id), eq(expenseCategories.companyId, companyId)));
    if (!row) {
      throw new NotFoundException('La categoría de egreso no existe.');
    }
    return row;
  }

  private toResult(row: ExpenseCategoryRow): ExpenseCategoryResult {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      state: row.state as ExpenseCategoryState,
    };
  }
}
