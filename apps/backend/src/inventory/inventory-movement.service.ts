import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { DATABASE } from '../database/database.constants.js';
import type { Database, DatabaseTransaction } from '../database/database.types.js';
import { inventoryItems, inventoryMovements } from '../database/schema/schema.js';
import { assertDefined } from '../shared/assert-defined.util.js';
import { fromMilliUnits, toMilliUnits } from '../shared/quantity.util.js';

import type { CreateInventoryMovementDto } from './create-inventory-movement.dto.js';
import type { InventoryMovementResult } from './inventory.types.js';

type InventoryItemRow = typeof inventoryItems.$inferSelect;
type InventoryMovementRow = typeof inventoryMovements.$inferSelect;

/**
 * RF-28/29: registrar y listar movimientos de stock — separado de
 * `InventoryService` porque la aritmética de existencias (in/out/
 * adjustment, el bloqueo de fila) es su propia responsabilidad frente al
 * CRUD del catálogo de ítems.
 */
@Injectable()
export class InventoryMovementService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  /**
   * Registra un movimiento y actualiza `current_stock` en la misma
   * transacción, con el ítem bloqueado (`FOR UPDATE`) para que dos
   * movimientos concurrentes sobre el mismo ítem no partan del mismo
   * `previousStock` y se pisen entre sí.
   */
  async register(
    companyId: string,
    userId: string,
    itemId: string,
    input: CreateInventoryMovementDto,
  ): Promise<InventoryMovementResult> {
    return this.db.transaction((tx) =>
      this.applyMovement(tx, { companyId, userId, itemId, input }),
    );
  }

  /**
   * El mismo bloqueo/cálculo que `register()`, pero recibiendo la `tx` de
   * afuera — para que otro service (ej. `ProductSalesService`) pueda sumar
   * el descuento de stock a SU PROPIA transacción en vez de anidar una
   * nueva (mismo patrón que `PaymentsService` + `PaymentCommissionService`).
   * Los demás parámetros van en un objeto (no 4 sueltos) para no chocar con
   * el `max-params` de oxlint una vez sumada la `tx`.
   */
  async applyMovement(
    tx: DatabaseTransaction,
    params: {
      companyId: string;
      userId: string;
      itemId: string;
      input: CreateInventoryMovementDto;
    },
  ): Promise<InventoryMovementResult> {
    const { companyId, userId, itemId, input } = params;
    const item = await this.loadItemLocked(tx, companyId, itemId);

    const requestedMilli = toMilliUnits(input.quantity);
    if (input.movementType === 'adjustment') {
      if (requestedMilli === 0) {
        throw new BadRequestException('quantity no puede ser cero en un ajuste.');
      }
    } else if (requestedMilli <= 0) {
      throw new BadRequestException('quantity debe ser mayor que cero para in/out.');
    }

    const previousStockMilli = toMilliUnits(item.currentStock);
    const signedDelta = input.movementType === 'out' ? -requestedMilli : requestedMilli;
    const resultingStockMilli = previousStockMilli + signedDelta;

    if (resultingStockMilli < 0) {
      throw new BadRequestException(
        'El movimiento dejaría el inventario en negativo; no hay existencia suficiente.',
      );
    }

    const resultingStock = fromMilliUnits(resultingStockMilli);

    const [insertedMovement] = await tx
      .insert(inventoryMovements)
      .values({
        companyId,
        inventoryItemId: itemId,
        movementType: input.movementType,
        quantity: input.quantity,
        previousStock: item.currentStock,
        resultingStock,
        reason: input.reason ?? null,
        createdBy: userId,
      })
      .returning();
    const movement = assertDefined(
      insertedMovement,
      'INSERT into inventory_movements did not return a row.',
    );

    await tx
      .update(inventoryItems)
      .set({ currentStock: resultingStock, updatedAt: new Date().toISOString() })
      .where(eq(inventoryItems.id, itemId));

    return this.toResult(movement);
  }

  async listFor(companyId: string, itemId: string): Promise<InventoryMovementResult[]> {
    const [item] = await this.db
      .select({ id: inventoryItems.id })
      .from(inventoryItems)
      .where(and(eq(inventoryItems.id, itemId), eq(inventoryItems.companyId, companyId)));
    if (!item) {
      throw new NotFoundException('El ítem de inventario no existe.');
    }

    const rows = await this.db
      .select()
      .from(inventoryMovements)
      .where(
        and(
          eq(inventoryMovements.companyId, companyId),
          eq(inventoryMovements.inventoryItemId, itemId),
        ),
      )
      .orderBy(inventoryMovements.createdAt);

    return rows.map((row) => this.toResult(row));
  }

  private async loadItemLocked(
    tx: DatabaseTransaction,
    companyId: string,
    id: string,
  ): Promise<InventoryItemRow> {
    const [row] = await tx
      .select()
      .from(inventoryItems)
      .where(and(eq(inventoryItems.id, id), eq(inventoryItems.companyId, companyId)))
      .for('update');
    if (!row) {
      throw new NotFoundException('El ítem de inventario no existe.');
    }
    return row;
  }

  private toResult(row: InventoryMovementRow): InventoryMovementResult {
    return {
      id: row.id,
      inventoryItemId: row.inventoryItemId,
      movementType: row.movementType as InventoryMovementResult['movementType'],
      quantity: row.quantity,
      previousStock: row.previousStock,
      resultingStock: row.resultingStock,
      reason: row.reason,
      createdAt: row.createdAt,
    };
  }
}
