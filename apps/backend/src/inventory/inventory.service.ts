import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';

import { DATABASE } from '../database/database.constants.js';
import type { Database } from '../database/database.types.js';
import { inventoryItems, inventoryMovements } from '../database/schema/schema.js';
import { assertDefined } from '../shared/assert-defined.util.js';
import { PG_FOREIGN_KEY_VIOLATION, PG_UNIQUE_VIOLATION, pgErrorCode } from '../shared/pg-error.util.js';
import { toMilliUnits } from '../shared/quantity.util.js';

import type { CreateInventoryItemDto } from './create-inventory-item.dto.js';
import { InventoryCategoryService } from './inventory-category.service.js';
import type {
  InventoryItemResult,
  InventoryItemState,
  ListInventoryItemsFilter,
} from './inventory.types.js';
import type { UpdateInventoryItemDto } from './update-inventory-item.dto.js';

type InventoryItemRow = typeof inventoryItems.$inferSelect;

// RF-28 a RF-30. Movimientos en `InventoryMovementService`; catálogo de
// categorías (agrupación simple, no del ERS) en `InventoryCategoryService`.
@Injectable()
export class InventoryService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly categories: InventoryCategoryService,
  ) {}

  // RF-28: registra el ítem y, si trae existencia inicial, su primer
  // movimiento — así `inventory_movements` sigue siendo el único origen.
  async create(
    companyId: string,
    userId: string,
    input: CreateInventoryItemDto,
  ): Promise<InventoryItemResult> {
    const initialStock = input.initialStock ?? '0.000';
    const minimumStock = input.minimumStock ?? '0.000';
    const category = input.categoryId
      ? await this.categories.load(companyId, input.categoryId)
      : null;

    try {
      return await this.db.transaction(async (tx) => {
        const [insertedRow] = await tx
          .insert(inventoryItems)
          .values({
            companyId,
            name: input.name,
            description: input.description ?? null,
            unitOfMeasure: input.unitOfMeasure,
            currentStock: initialStock,
            minimumStock,
            categoryId: category?.id ?? null,
          })
          .returning();
        const row = assertDefined(insertedRow, 'INSERT into inventory_items did not return a row.');

        if (toMilliUnits(initialStock) > 0) {
          await tx.insert(inventoryMovements).values({
            companyId,
            inventoryItemId: row.id,
            movementType: 'in',
            quantity: initialStock,
            previousStock: '0.000',
            resultingStock: initialStock,
            reason: 'Existencia inicial',
            createdBy: userId,
          });
        }

        return this.toResult(row, category?.name ?? null);
      });
    } catch (error) {
      if (pgErrorCode(error) === PG_UNIQUE_VIOLATION) {
        throw new ConflictException('Ya existe un ítem de inventario con ese nombre.');
      }
      throw error;
    }
  }

  async findAll(
    companyId: string,
    filter: ListInventoryItemsFilter,
  ): Promise<InventoryItemResult[]> {
    const conditions = [eq(inventoryItems.companyId, companyId)];
    if (filter.state !== undefined) {
      conditions.push(eq(inventoryItems.state, filter.state));
    }
    if (filter.belowMinimum) {
      conditions.push(sql`${inventoryItems.currentStock} <= ${inventoryItems.minimumStock}`);
    }
    if (filter.categoryId !== undefined) {
      conditions.push(eq(inventoryItems.categoryId, filter.categoryId));
    }

    const rows = await this.db
      .select()
      .from(inventoryItems)
      .where(and(...conditions))
      .orderBy(inventoryItems.name);

    const categories = await this.categories.list(companyId);
    const nameById = new Map(categories.map((category) => [category.id, category.name]));

    return rows.map((row) =>
      this.toResult(row, row.categoryId ? (nameById.get(row.categoryId) ?? null) : null),
    );
  }

  async findOne(companyId: string, id: string): Promise<InventoryItemResult> {
    const row = await this.loadItem(companyId, id);
    const categoryName = row.categoryId
      ? (await this.categories.load(companyId, row.categoryId)).name
      : null;
    return this.toResult(row, categoryName);
  }

  async update(
    companyId: string,
    id: string,
    input: UpdateInventoryItemDto,
  ): Promise<InventoryItemResult> {
    await this.loadItem(companyId, id);

    const patch: Partial<typeof inventoryItems.$inferInsert> = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.description !== undefined) patch.description = input.description;
    if (input.unitOfMeasure !== undefined) patch.unitOfMeasure = input.unitOfMeasure;
    if (input.minimumStock !== undefined) patch.minimumStock = input.minimumStock;
    if (input.state !== undefined) patch.state = input.state;
    if (input.categoryId !== undefined) {
      if (input.categoryId !== null) {
        await this.categories.load(companyId, input.categoryId);
      }
      patch.categoryId = input.categoryId;
    }

    try {
      if (Object.keys(patch).length > 0) {
        await this.db
          .update(inventoryItems)
          .set({ ...patch, updatedAt: new Date().toISOString() })
          .where(eq(inventoryItems.id, id));
      }
    } catch (error) {
      if (pgErrorCode(error) === PG_UNIQUE_VIOLATION) {
        throw new ConflictException('Ya existe un ítem de inventario con ese nombre.');
      }
      throw error;
    }

    return this.findOne(companyId, id);
  }

  // DELETE real: sin ON DELETE CASCADE en inventory_movements (migración
  // 001), Postgres protege el historial de un ítem que ya tuvo actividad.
  async remove(companyId: string, id: string): Promise<void> {
    await this.loadItem(companyId, id);

    try {
      await this.db
        .delete(inventoryItems)
        .where(and(eq(inventoryItems.id, id), eq(inventoryItems.companyId, companyId)));
    } catch (error) {
      if (pgErrorCode(error) === PG_FOREIGN_KEY_VIOLATION) {
        throw new ConflictException(
          'No se puede eliminar: tiene movimientos registrados. Desactívalo en su lugar (PATCH state=2).',
        );
      }
      throw error;
    }
  }

  private async loadItem(companyId: string, id: string): Promise<InventoryItemRow> {
    const [row] = await this.db
      .select()
      .from(inventoryItems)
      .where(and(eq(inventoryItems.id, id), eq(inventoryItems.companyId, companyId)));
    if (!row) {
      throw new NotFoundException('El ítem de inventario no existe.');
    }
    return row;
  }

  private toResult(row: InventoryItemRow, categoryName: string | null): InventoryItemResult {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      unitOfMeasure: row.unitOfMeasure,
      currentStock: row.currentStock,
      minimumStock: row.minimumStock,
      state: row.state as InventoryItemState,
      categoryId: row.categoryId,
      categoryName,
    };
  }
}
