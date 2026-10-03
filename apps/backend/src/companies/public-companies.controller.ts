import { Controller, Get, Param, Res, StreamableFile } from '@nestjs/common';
import type { Response } from 'express';

import type { PublicCompanyProfile } from './companies.types.js';
// Value imports: constructor-injected (see the note in access-token.guard.ts).
import { CompanyBrandingService } from './company-branding.service.js';
import { CompanyProfileService } from './company-profile.service.js';

/**
 * Routes reachable without a session: the login page of `<link>/<slug>` needs
 * them before anyone signs in. Never add business data here.
 */
@Controller('public/companies')
export class PublicCompaniesController {
  constructor(
    private readonly profiles: CompanyProfileService,
    private readonly branding: CompanyBrandingService,
  ) {}

  @Get(':slug')
  findBySlug(@Param('slug') slug: string): Promise<PublicCompanyProfile> {
    return this.profiles.findBySlug(slug);
  }

  @Get(':slug/logo')
  async logo(
    @Param('slug') slug: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const { stream, contentType } = await this.branding.openLogo(slug);
    response.setHeader('Content-Type', contentType);
    response.setHeader('Cache-Control', 'public, max-age=300');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    // Un SVG es un documento: si alguien lo abre directo, que no pueda
    // ejecutar nada aunque traiga un <script>.
    response.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'");
    return new StreamableFile(stream);
  }
}
