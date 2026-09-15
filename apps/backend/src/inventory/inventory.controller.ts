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

// Value imports: DI (InventoryService, InventoryMovementService) and
// @Body()/@Query() DTOs need the real class at runtime (see the note in
// access-token.guard.ts).
import { CreateInventoryItemDto } from './create-inventory-item.dto.js';
import { CreateInventoryMovementDto } from './create-inventory-movement.dto.js';
import { InventoryMovementService } from './inventory-movement.service.js';
import { InventoryService } from './inventory.service.js';
import type { InventoryItemResult, InventoryMovementResult } from './inventory.types.js';
import { ListInventoryItemsQueryDto } from './list-inventory-items-query.dto.js';
import { UpdateInventoryItemDto } from './update-inventory-item.dto.js';

/** RF-28 a RF-30. */
@Controller('inventory-items')
@UseGuards(AccessTokenGuard, PermissionGuard)
export class InventoryController {
  constructor(
    private readonly inventory: InventoryService,
    private readonly movements: InventoryMovementService,
  ) {}

  @Post()
  @RequirePermissions('inventario.create')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateInventoryItemDto,
  ): Promise<InventoryItemResult> {
    return this.inventory.create(user.companyId, user.id, dto);
  }

  @Get()
  @RequirePermissions('inventario.read')
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListInventoryItemsQueryDto,
  ): Promise<InventoryItemResult[]> {
    return this.inventory.findAll(user.companyId, {
      state: query.state as 1 | 2 | undefined,
      belowMinimum: query.belowMinimum,
    });
  }

  @Get(':id')
  @RequirePermissions('inventario.read')
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<InventoryItemResult> {
    return this.inventory.findOne(user.companyId, id);
  }

  @Patch(':id')
  @RequirePermissions('inventario.update')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInventoryItemDto,
  ): Promise<InventoryItemResult> {
    return this.inventory.update(user.companyId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('inventario.delete')
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.inventory.remove(user.companyId, id);
  }

  @Get(':id/movements')
  @RequirePermissions('inventario.read')
  listMovements(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<InventoryMovementResult[]> {
    return this.movements.listFor(user.companyId, id);
  }

  /**
   * No existe un permiso dedicado para registrar movimientos en el
   * catálogo (`inventario.create/read/update/delete`); se gatea con
   * `inventario.update` por ser la más cercana en intención (cambia el
   * estado de un ítem existente). Señalado para revisar si conviene un
   * permiso propio cuando se afine el alcance con el cliente.
   */
  @Post(':id/movements')
  @RequirePermissions('inventario.update')
  registerMovement(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateInventoryMovementDto,
  ): Promise<InventoryMovementResult> {
    return this.movements.register(user.companyId, user.id, id, dto);
  }
}
