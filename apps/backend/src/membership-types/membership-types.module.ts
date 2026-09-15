import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';

import { MembershipTypesController } from './membership-types.controller.js';
import { MembershipTypesService } from './membership-types.service.js';

/** Módulo de negocio Membresías (RF-12, RF-13). */
@Module({
  imports: [AuthModule],
  controllers: [MembershipTypesController],
  providers: [MembershipTypesService],
})
export class MembershipTypesModule {}
