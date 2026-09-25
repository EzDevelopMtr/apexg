import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';

import { SavingsController } from './savings.controller.js';
import { SavingsService } from './savings.service.js';

/** Bolsillos de ahorro: apartar utilidad con un destino concreto. */
@Module({
  imports: [AuthModule],
  controllers: [SavingsController],
  providers: [SavingsService],
})
export class SavingsModule {}
