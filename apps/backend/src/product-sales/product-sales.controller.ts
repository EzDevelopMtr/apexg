import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';

import { AccessTokenGuard } from '../auth/access-token.guard.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { PermissionGuard } from '../auth/permission.guard.js';
import { RequirePermissions } from '../auth/require-permissions.decorator.js';
// Value import: DI needs the real class at runtime (see access-token.guard.ts).
import { InventoryService } from '../inventory/inventory.service.js';
import type { InventoryItemResult } from '../inventory/inventory.types.js';

// Value import: DI (ProductSalesService) and @Body() DTOs need the real
// class at runtime (see the note in access-token.guard.ts).
import { CreateProductSaleDto } from './create-product-sale.dto.js';
import { ProductSalesService } from './product-sales.service.js';
import type { ProductSaleResult } from './product-sales.types.js';

/**
 * Venta de productos en el mostrador. Gateado con `apartado_diario.*`, no con
 * `inventario.*`: vender es parte del Apartado diario, que §2.2 del ERS le da
 * a la recepcionista, mientras le niega Inventario. Con `inventario.read` el
 * Apartado diario entero no le cargaba (CP-115). El stock lo sigue descontando
 * el servidor dentro de la venta; editarlo a mano sigue exigiendo inventario.
 */
@Controller('product-sales')
@UseGuards(AccessTokenGuard, PermissionGuard)
export class ProductSalesController {
  constructor(
    private readonly sales: ProductSalesService,
    private readonly inventory: InventoryService,
  ) {}

  @Post()
  @RequirePermissions('apartado_diario.create')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateProductSaleDto,
  ): Promise<ProductSaleResult> {
    return this.sales.create(user.companyId, user.id, dto);
  }

  @Get()
  @RequirePermissions('apartado_diario.read')
  findAll(@CurrentUser() user: AuthenticatedUser): Promise<ProductSaleResult[]> {
    return this.sales.findAll(user.companyId);
  }

  /**
   * Lo que se puede vender: los ítems activos. Es la lista que necesita el
   * formulario de venta, sin abrirle a quien vende el módulo de Inventario.
   */
  @Get('catalog')
  @RequirePermissions('apartado_diario.read')
  catalog(@CurrentUser() user: AuthenticatedUser): Promise<InventoryItemResult[]> {
    return this.inventory.findAll(user.companyId, { state: 1 });
  }
}
