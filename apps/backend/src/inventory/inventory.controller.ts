import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { AccessTokenGuard } from '../auth/access-token.guard.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { PermissionGuard } from '../auth/permission.guard.js';
import { RequirePermissions } from '../auth/require-permissions.decorator.js';

// Value imports: DI (InventoryService, InventoryMovementService,
// InventoryCategoryService) and @Body()/@Query() DTOs need the real class
// at runtime (see the note in access-token.guard.ts).
import { CreateInventoryCategoryDto } from './create-inventory-category.dto.js';
import { CreateInventoryItemDto } from './create-inventory-item.dto.js';
import { CreateInventoryMovementDto } from './create-inventory-movement.dto.js';
import { InventoryCategoryService } from './inventory-category.service.js';
import { InventoryMovementService } from './inventory-movement.service.js';
import { InventoryService } from './inventory.service.js';
import type {
  InventoryCategoryResult,
  InventoryItemResult,
  InventoryMovementResult,
} from './inventory.types.js';
import { ListInventoryItemsQueryDto } from './list-inventory-items-query.dto.js';
import { UpdateInventoryCategoryDto } from './update-inventory-category.dto.js';
import { UpdateInventoryItemDto } from './update-inventory-item.dto.js';

/** RF-28 a RF-30. Sin prefijo de clase: ítems y categorías son rutas hermanas (mismo patrón que Egresos). */
@Controller()
@UseGuards(AccessTokenGuard, PermissionGuard)
export class InventoryController {
  constructor(
    private readonly inventory: InventoryService,
    private readonly movements: InventoryMovementService,
    private readonly categories: InventoryCategoryService,
  ) {}

  @Post('inventory-categories')
  @RequirePermissions('inventario.create')
  createCategory(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateInventoryCategoryDto,
  ): Promise<InventoryCategoryResult> {
    return this.categories.create(user.companyId, dto);
  }

  @Get('inventory-categories')
  @RequirePermissions('inventario.read')
  listCategories(@CurrentUser() user: AuthenticatedUser): Promise<InventoryCategoryResult[]> {
    return this.categories.list(user.companyId);
  }

  @Patch('inventory-categories/:id')
  @RequirePermissions('inventario.update')
  updateCategory(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInventoryCategoryDto,
  ): Promise<InventoryCategoryResult> {
    return this.categories.update(user.companyId, id, dto);
  }

  @Delete('inventory-categories/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('inventario.delete')
  async removeCategory(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.categories.remove(user.companyId, id);
  }

  @Post('inventory-items')
  @RequirePermissions('inventario.create')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateInventoryItemDto,
  ): Promise<InventoryItemResult> {
    return this.inventory.create(user.companyId, user.id, dto);
  }

  @Get('inventory-items')
  @RequirePermissions('inventario.read')
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListInventoryItemsQueryDto,
  ): Promise<InventoryItemResult[]> {
    return this.inventory.findAll(user.companyId, {
      state: query.state as 1 | 2 | undefined,
      belowMinimum: query.belowMinimum,
      categoryId: query.categoryId,
    });
  }

  @Get('inventory-items/:id')
  @RequirePermissions('inventario.read')
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<InventoryItemResult> {
    return this.inventory.findOne(user.companyId, id);
  }

  @Patch('inventory-items/:id')
  @RequirePermissions('inventario.update')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInventoryItemDto,
  ): Promise<InventoryItemResult> {
    return this.inventory.update(user.companyId, id, dto);
  }

  @Delete('inventory-items/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('inventario.delete')
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.inventory.remove(user.companyId, id);
  }

  @Get('inventory-items/:id/movements')
  @RequirePermissions('inventario.read')
  listMovements(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<InventoryMovementResult[]> {
    return this.movements.listFor(user.companyId, id);
  }

  // No existe un permiso dedicado para movimientos; se gatea con
  // `inventario.update` (cambia el estado de un ítem existente).
  @Post('inventory-items/:id/movements')
  @RequirePermissions('inventario.update')
  registerMovement(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateInventoryMovementDto,
  ): Promise<InventoryMovementResult> {
    return this.movements.register(user.companyId, user.id, id, dto);
  }
}
