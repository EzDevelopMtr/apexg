import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';

import { ExpenseCategoryService } from './expense-category.service.js';
import { ExpensesController } from './expenses.controller.js';
import { ExpensesService } from './expenses.service.js';

/** Módulo de negocio Egresos (RF-26, RF-27). */
@Module({
  imports: [AuthModule],
  controllers: [ExpensesController],
  providers: [ExpensesService, ExpenseCategoryService],
})
export class ExpensesModule {}
