import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from './auth/auth.module.js';
import { DatabaseModule } from './database/database.module.js';
import { ProvisioningModule } from './provisioning/provisioning.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    ProvisioningModule,
    AuthModule,
  ],
})
export class AppModule {}
