import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { PaymentReceiptService } from '../payments/payment-receipt.service.js';

import { TrainerCommissionService } from './trainer-commission.service.js';
import { TrainerSettlementService } from './trainer-settlement.service.js';
import { TrainersController } from './trainers.controller.js';
import { TrainersService } from './trainers.service.js';

/** Módulo de negocio Entrenadores (RF-22 a RF-25). */
@Module({
  imports: [AuthModule],
  controllers: [TrainersController],
  providers: [
    TrainersService,
    TrainerCommissionService,
    TrainerSettlementService,
    PaymentReceiptService,
  ],
})
export class TrainersModule {}
