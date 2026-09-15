import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';

import { AccessTokenGuard } from '../auth/access-token.guard.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { PermissionGuard } from '../auth/permission.guard.js';
import { RequirePermissions } from '../auth/require-permissions.decorator.js';

// Value import: DI (ProductSalesService) and @Body() DTOs need the real
// class at runtime (see the note in access-token.guard.ts).
import { CreateProductSaleDto } from './create-product-sale.dto.js';
import { ProductSalesService } from './product-sales.service.js';
import type { ProductSaleResult } from './product-sales.types.js';

/**
 * Venta de productos de inventario. Gateado con `inventario.*` (no
 * `pagos.*`): lo que autoriza esta acción es que cambia stock, igual que
 * un movimiento manual — no es un pago de membresía.
 */
@Controller('product-sales')
@UseGuards(AccessTokenGuard, PermissionGuard)
export class ProductSalesController {
  constructor(private readonly sales: ProductSalesService) {}

  @Post()
  @RequirePermissions('inventario.update')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateProductSaleDto,
  ): Promise<ProductSaleResult> {
    return this.sales.create(user.companyId, user.id, dto);
  }

  @Get()
  @RequirePermissions('inventario.read')
  findAll(@CurrentUser() user: AuthenticatedUser): Promise<ProductSaleResult[]> {
    return this.sales.findAll(user.companyId);
  }
}
