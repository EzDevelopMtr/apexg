import { Module } from '@nestjs/common';

import { CompanyBrandingService } from './company-branding.service.js';
import { CompanyLogoStore } from './company-logo.store.js';
import { CompanyProfileService } from './company-profile.service.js';
import { PublicCompaniesController } from './public-companies.controller.js';

/** The company as a tenant: how `<link>/<slug>` finds it. */
@Module({
  controllers: [PublicCompaniesController],
  providers: [CompanyProfileService, CompanyBrandingService, CompanyLogoStore],
  exports: [CompanyProfileService, CompanyBrandingService],
})
export class CompaniesModule {}
