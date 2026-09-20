import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { DATABASE } from '../database/database.constants.js';
import type { Database } from '../database/database.types.js';
import { inventoryCategories } from '../database/schema/schema.js';
import { assertDefined } from '../shared/assert-defined.util.js';
import {
  PG_FOREIGN_KEY_VIOLATION,
  PG_UNIQUE_VIOLATION,
  pgErrorCode,
} from '../shared/pg-error.util.js';

import type { CreateInventoryCategoryDto } from './create-inventory-category.dto.js';
import type { UpdateInventoryCategoryDto } from './update-inventory-category.dto.js';
import type { InventoryCategoryResult, InventoryCategoryState } from './inventory.types.js';

type InventoryCategoryRow = typeof inventoryCategories.$inferSelect;

/**
 * Catálogo de categorías de inventario — agrupación simple para
 * diferenciar ítems, no un requisito del ERS (que deja el alcance de
 * Inventario pendiente, §2.4). Su propia clase, igual que
 * `ExpenseCategoryService`: `InventoryService` la usa para resolver la
 * categoría de un ítem, pero administrar el catálogo es aparte.
 */
@Injectable()
export class InventoryCategoryService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async create(
    companyId: string,
    input: CreateInventoryCategoryDto,
  ): Promise<InventoryCategoryResult> {
    try {
      const [row] = await this.db
        .insert(inventoryCategories)
        .values({ companyId, name: input.name, description: input.description ?? null })
        .returning();
      return this.toResult(
        assertDefined(row, 'INSERT into inventory_categories did not return a row.'),
      );
    } catch (error) {
      if (pgErrorCode(error) === PG_UNIQUE_VIOLATION) {
        throw new ConflictException('Ya existe una categoría con ese nombre.');
      }
      throw error;
    }
  }

  async list(companyId: string): Promise<InventoryCategoryResult[]> {
    const rows = await this.db
      .select()
      .from(inventoryCategories)
      .where(eq(inventoryCategories.companyId, companyId))
      .orderBy(inventoryCategories.name);
    return rows.map((row) => this.toResult(row));
  }

  async update(
    companyId: string,
    id: string,
    input: UpdateInventoryCategoryDto,
  ): Promise<InventoryCategoryResult> {
    await this.load(companyId, id);

    const patch: Partial<typeof inventoryCategories.$inferInsert> = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.description !== undefined) patch.description = input.description;
    if (input.state !== undefined) patch.state = input.state;

    try {
      if (Object.keys(patch).length > 0) {
        await this.db
          .update(inventoryCategories)
          .set({ ...patch, updatedAt: new Date().toISOString() })
          .where(eq(inventoryCategories.id, id));
      }
    } catch (error) {
      if (pgErrorCode(error) === PG_UNIQUE_VIOLATION) {
        throw new ConflictException('Ya existe una categoría con ese nombre.');
      }
      throw error;
    }

    return this.toResult(await this.load(companyId, id));
  }

  /** DELETE real: `inventory_items.category_id` la protege sin ON DELETE CASCADE. */
  async remove(companyId: string, id: string): Promise<void> {
    await this.load(companyId, id);
    try {
      await this.db
        .delete(inventoryCategories)
        .where(and(eq(inventoryCategories.id, id), eq(inventoryCategories.companyId, companyId)));
    } catch (error) {
      if (pgErrorCode(error) === PG_FOREIGN_KEY_VIOLATION) {
        throw new ConflictException(
          'No se puede eliminar: hay ítems de inventario con esta categoría. Desactívala en su lugar (PATCH state=2).',
        );
      }
      throw error;
    }
  }

  async load(companyId: string, id: string): Promise<InventoryCategoryRow> {
    const [row] = await this.db
      .select()
      .from(inventoryCategories)
      .where(and(eq(inventoryCategories.id, id), eq(inventoryCategories.companyId, companyId)));
    if (!row) {
      throw new NotFoundException('La categoría de inventario no existe.');
    }
    return row;
  }

  private toResult(row: InventoryCategoryRow): InventoryCategoryResult {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      state: row.state as InventoryCategoryState,
    };
  }
}
