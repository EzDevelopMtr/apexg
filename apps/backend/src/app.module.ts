import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from './auth/auth.module.js';
import { ClientsModule } from './clients/clients.module.js';
import { DailyLogModule } from './daily-log/daily-log.module.js';
import { DatabaseModule } from './database/database.module.js';
import { ExpensesModule } from './expenses/expenses.module.js';
import { FinanceModule } from './finance/finance.module.js';
import { InventoryModule } from './inventory/inventory.module.js';
import { MembershipTypesModule } from './membership-types/membership-types.module.js';
import { PaymentsModule } from './payments/payments.module.js';
import { ProductSalesModule } from './product-sales/product-sales.module.js';
import { ProvisioningModule } from './provisioning/provisioning.module.js';
import { TrainersModule } from './trainers/trainers.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    ProvisioningModule,
    AuthModule,
    ClientsModule,
    MembershipTypesModule,
    PaymentsModule,
    TrainersModule,
    ExpensesModule,
    InventoryModule,
    FinanceModule,
    DailyLogModule,
    ProductSalesModule,
  ],
})
export class AppModule {}
