import { Controller, Get, Param } from '@nestjs/common';

import type { PublicCompanyProfile } from './companies.types.js';
// Value import: constructor-injected (see the note in access-token.guard.ts).
import { CompanyProfileService } from './company-profile.service.js';

/**
 * Routes reachable without a session: the login page of `<link>/<slug>` needs
 * them before anyone signs in. Never add business data here.
 */
@Controller('public/companies')
export class PublicCompaniesController {
  constructor(private readonly profiles: CompanyProfileService) {}

  @Get(':slug')
  findBySlug(@Param('slug') slug: string): Promise<PublicCompanyProfile> {
    return this.profiles.findBySlug(slug);
  }
}
