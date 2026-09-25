import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { DATABASE } from '../database/database.constants.js';
import type { Database, DatabaseTransaction } from '../database/database.types.js';
import { clients, inventoryItems, productSales } from '../database/schema/schema.js';
import { InventoryMovementService } from '../inventory/inventory-movement.service.js';
import { assertDefined } from '../shared/assert-defined.util.js';
import {
  AuthorLookupService,
  authorName,
} from '../shared/author-lookup.service.js';

import type { CreateProductSaleDto } from './create-product-sale.dto.js';
import type { ProductSaleResult } from './product-sales.types.js';

type ProductSaleRow = typeof productSales.$inferSelect;

/**
 * Venta de un ítem de inventario. Descuenta stock reutilizando
 * `InventoryMovementService.applyMovement()` dentro de esta misma
 * transacción (mismo patrón que `PaymentsService` + `PaymentCommissionService`)
 * — así una venta y su movimiento de stock se confirman o revierten juntos.
 */
@Injectable()
export class ProductSalesService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly movements: InventoryMovementService,
    private readonly authors: AuthorLookupService,
  ) {}

  async create(
    companyId: string,
    userId: string,
    input: CreateProductSaleDto,
  ): Promise<ProductSaleResult> {
    return this.db.transaction(async (tx) => {
      const item = await this.loadItem(tx, companyId, input.inventoryItemId);
      const client = input.clientId
        ? await this.loadClient(tx, companyId, input.clientId)
        : null;

      await this.movements.applyMovement(tx, {
        companyId,
        userId,
        itemId: item.id,
        input: {
          movementType: 'out',
          quantity: input.quantity,
          reason: 'Venta de producto',
        },
      });

      const [insertedRow] = await tx
        .insert(productSales)
        .values({
          companyId,
          inventoryItemId: item.id,
          clientId: client?.id ?? null,
          quantity: input.quantity,
          amount: input.amount,
          paymentMethod: input.paymentMethod,
          soldAt: input.soldAt ?? new Date().toISOString(),
          notes: input.notes ?? null,
          createdBy: userId,
        })
        .returning();
      const row = assertDefined(insertedRow, 'INSERT into product_sales did not return a row.');

      return this.toResult(
        row,
        item.name,
        client?.fullName ?? null,
        await this.authors.nameOf(userId),
      );
    });
  }

  async findAll(companyId: string): Promise<ProductSaleResult[]> {
    const rows = await this.db
      .select()
      .from(productSales)
      .where(eq(productSales.companyId, companyId))
      .orderBy(productSales.soldAt);

    const items = await this.db
      .select({ id: inventoryItems.id, name: inventoryItems.name })
      .from(inventoryItems)
      .where(eq(inventoryItems.companyId, companyId));
    const itemNameById = new Map(items.map((item) => [item.id, item.name]));

    const clientRows = await this.db
      .select({ id: clients.id, fullName: clients.fullName })
      .from(clients)
      .where(eq(clients.companyId, companyId));
    const clientNameById = new Map(clientRows.map((client) => [client.id, client.fullName]));

    const authors = await this.authors.namesOf(rows.map((row) => row.createdBy));
    return rows.map((row) =>
      this.toResult(
        row,
        itemNameById.get(row.inventoryItemId) ?? '—',
        row.clientId ? (clientNameById.get(row.clientId) ?? null) : null,
        authorName(authors, row.createdBy),
      ),
    );
  }

  private async loadItem(tx: DatabaseTransaction, companyId: string, id: string) {
    const [item] = await tx
      .select({ id: inventoryItems.id, name: inventoryItems.name })
      .from(inventoryItems)
      .where(and(eq(inventoryItems.id, id), eq(inventoryItems.companyId, companyId)));
    if (!item) {
      throw new NotFoundException('El ítem de inventario no existe.');
    }
    return item;
  }

  private async loadClient(tx: DatabaseTransaction, companyId: string, id: string) {
    const [client] = await tx
      .select({ id: clients.id, fullName: clients.fullName })
      .from(clients)
      .where(and(eq(clients.id, id), eq(clients.companyId, companyId)));
    if (!client) {
      throw new NotFoundException('El cliente no existe.');
    }
    return client;
  }

  private toResult(
    row: ProductSaleRow,
    itemName: string,
    clientName: string | null,
    recordedBy: string,
  ): ProductSaleResult {
    return {
      id: row.id,
      inventoryItemId: row.inventoryItemId,
      itemName,
      clientId: row.clientId,
      clientName,
      quantity: row.quantity,
      amount: row.amount,
      paymentMethod: row.paymentMethod as ProductSaleResult['paymentMethod'],
      soldAt: row.soldAt,
      notes: row.notes,
      recordedBy,
    };
  }
}
