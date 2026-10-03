import { Module } from '@nestjs/common';

import { CompanyProfileService } from './company-profile.service.js';
import { PublicCompaniesController } from './public-companies.controller.js';

/** The company as a tenant: how `<link>/<slug>` finds it. */
@Module({
  controllers: [PublicCompaniesController],
  providers: [CompanyProfileService],
  exports: [CompanyProfileService],
})
export class CompaniesModule {}
