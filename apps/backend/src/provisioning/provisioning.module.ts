import { Module } from '@nestjs/common';

import { CompanyProvisioningService } from './company-provisioning.service.js';

/**
 * Aprovisionamiento de empresas. Sin controllers ni rutas: expone el
 * servicio para que lo consuma el futuro flujo administrativo de alta de
 * empresas. No ejecuta nada al inicializarse.
 */
@Module({
  providers: [CompanyProvisioningService],
  exports: [CompanyProvisioningService],
})
export class ProvisioningModule {}
