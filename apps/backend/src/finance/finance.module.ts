import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { ClientsModule } from '../clients/clients.module.js';

import { FinanceController } from './finance.controller.js';
import { FinanceService } from './finance.service.js';

/**
 * Módulo de negocio Finanzas (RF-31 a RF-33, RF-35). Importa `ClientsModule`
 * para reutilizar `ClientOverdueSyncService` (RF-21) en vez de duplicar esa
 * regla al contar clientes en mora.
 */
@Module({
  imports: [AuthModule, ClientsModule],
  controllers: [FinanceController],
  providers: [FinanceService],
  exports: [FinanceService],
})
export class FinanceModule {}
