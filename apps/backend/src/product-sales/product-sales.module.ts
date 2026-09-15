import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { InventoryModule } from '../inventory/inventory.module.js';

import { ProductSalesController } from './product-sales.controller.js';
import { ProductSalesService } from './product-sales.service.js';

/** Módulo de negocio Venta de productos — ver migración 006. */
@Module({
  imports: [AuthModule, InventoryModule],
  controllers: [ProductSalesController],
  providers: [ProductSalesService],
})
export class ProductSalesModule {}
