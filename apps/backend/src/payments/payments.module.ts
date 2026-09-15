import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';

import { PaymentCommissionService } from './payment-commission.service.js';
import { PaymentsController } from './payments.controller.js';
import { PaymentsService } from './payments.service.js';

/** Módulo de negocio Pagos (RF-17 a RF-20, SRS §4.4). */
@Module({
  imports: [AuthModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentCommissionService],
})
export class PaymentsModule {}
