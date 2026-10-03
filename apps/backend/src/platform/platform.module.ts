import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { CompaniesModule } from '../companies/companies.module.js';
import { ProvisioningModule } from '../provisioning/provisioning.module.js';

import { PlatformAuditService } from './platform-audit.service.js';
import { PlatformAuthController } from './platform-auth.controller.js';
import { PlatformAuthService } from './platform-auth.service.js';
import { PlatformCompaniesController } from './platform-companies.controller.js';
import { PlatformCompaniesService } from './platform-companies.service.js';
import { PlatformSettingsController } from './platform-settings.controller.js';
import { PlatformTokenGuard } from './platform-token.guard.js';

/** El super admin: administra gimnasios, nunca entra a los datos de uno. */
@Module({
  imports: [AuthModule, CompaniesModule, ProvisioningModule],
  controllers: [PlatformAuthController, PlatformCompaniesController, PlatformSettingsController],
  providers: [PlatformAuthService, PlatformCompaniesService, PlatformAuditService, PlatformTokenGuard],
  exports: [PlatformAuthService],
})
export class PlatformModule {}
