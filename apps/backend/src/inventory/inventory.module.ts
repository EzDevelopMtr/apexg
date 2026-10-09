import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';

import { InventoryCategoryService } from './inventory-category.service.js';
import { InventoryController } from './inventory.controller.js';
import { InventoryMovementService } from './inventory-movement.service.js';
import { InventoryService } from './inventory.service.js';

/** Módulo de negocio Inventario (RF-28 a RF-30). */
@Module({
  imports: [AuthModule],
  controllers: [InventoryController],
  providers: [InventoryService, InventoryMovementService, InventoryCategoryService],
  // ProductSalesModule reutiliza InventoryMovementService.applyMovement() para
  // descontar stock dentro de su transacción, e InventoryService para ofrecer
  // el catálogo de lo que se vende en el mostrador.
  exports: [InventoryMovementService, InventoryService],
})
export class InventoryModule {}
