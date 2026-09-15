import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';

import { InventoryController } from './inventory.controller.js';
import { InventoryMovementService } from './inventory-movement.service.js';
import { InventoryService } from './inventory.service.js';

/** Módulo de negocio Inventario (RF-28 a RF-30). */
@Module({
  imports: [AuthModule],
  controllers: [InventoryController],
  providers: [InventoryService, InventoryMovementService],
})
export class InventoryModule {}
