import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';

import { CompanyOnboardingService } from './company-onboarding.service.js';
import { CompanyProvisioningService } from './company-provisioning.service.js';

/**
 * Aprovisionamiento de empresas. Sin controllers ni rutas: hoy lo consume el
 * comando `company:create` (src/cli/create-company.ts); el panel del super
 * admin lo usará después. No ejecuta nada al inicializarse.
 */
@Module({
  imports: [AuthModule],
  providers: [CompanyProvisioningService, CompanyOnboardingService],
  exports: [CompanyProvisioningService, CompanyOnboardingService],
})
export class ProvisioningModule {}
