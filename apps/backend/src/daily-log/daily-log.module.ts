import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { FinanceModule } from '../finance/finance.module.js';

import { DailyLogController } from './daily-log.controller.js';
import { DailyLogService } from './daily-log.service.js';

/**
 * Módulo de negocio Apartado diario (RF-34). Importa `FinanceModule` para
 * reutilizar `FinanceService.getBalance` (ingresos del día) en vez de
 * duplicar la agregación de `payments` por día calendario local.
 */
@Module({
  imports: [AuthModule, FinanceModule],
  controllers: [DailyLogController],
  providers: [DailyLogService],
})
export class DailyLogModule {}
