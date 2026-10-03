import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

// Value imports: DI and DTO validation need the real classes at runtime.
import { brandColorProblem } from '../companies/brand-color.js';
import { CompanyBrandingService } from '../companies/company-branding.service.js';
import { isCompanySlug } from '../companies/company-slug.js';
import { CompanyOnboardingService } from '../provisioning/company-onboarding.service.js';
import type { UploadedFile as Upload } from '../shared/local-file-store.js';
import { temporaryPassword } from '../shared/temporary-password.js';

import { CurrentPlatformAdmin } from './current-platform-admin.decorator.js';
import { PlatformAuditService } from './platform-audit.service.js';
import { PlatformCompaniesService } from './platform-companies.service.js';
import type { IssuedCredential, PlatformCompanyRow } from './platform-companies.types.js';
import { CreatePlatformCompanyDto, UpdatePlatformCompanyDto } from './platform-company.dto.js';
import { PlatformTokenGuard } from './platform-token.guard.js';
import type { AuthenticatedPlatformAdmin } from './platform.types.js';

const BAD_SLUG =
  'El identificador debe tener 3 a 40 caracteres: minúsculas, dígitos y guiones, y no puede ser una ruta de la app.';

/** El panel del super admin: alta, marca, suspensión y soporte de gimnasios. */
@Controller('platform/companies')
@UseGuards(PlatformTokenGuard)
export class PlatformCompaniesController {
  constructor(
    private readonly companies: PlatformCompaniesService,
    private readonly onboarding: CompanyOnboardingService,
    private readonly branding: CompanyBrandingService,
    private readonly audit: PlatformAuditService,
  ) {}

  @Get()
  list(): Promise<PlatformCompanyRow[]> {
    return this.companies.list();
  }

  /** Devuelve la contraseña inicial del administrador: no se puede volver a ver. */
  @Post()
  async create(
    @CurrentPlatformAdmin() admin: AuthenticatedPlatformAdmin,
    @Body() dto: CreatePlatformCompanyDto,
  ): Promise<{ companyId: string; administrator: IssuedCredential }> {
    if (!isCompanySlug(dto.slug)) throw new BadRequestException(BAD_SLUG);
    // Antes del alta: el color se aplica después, y un rechazo ahí dejaba el
    // gimnasio creado aunque la petición respondiera error.
    const colorProblem = dto.brandColor ? brandColorProblem(dto.brandColor) : null;
    if (colorProblem) throw new BadRequestException(colorProblem);
    const password = temporaryPassword();
    const result = await this.onboarding.onboard({
      // Los mismos que APEX GYM: la app aún asume Colombia (ver el plan).
      company: { name: dto.name.trim(), slug: dto.slug, currency: 'COP', timezone: 'America/Bogota' },
      administrator: { username: dto.adminUsername, fullName: dto.adminFullName, password },
    });
    if (dto.brandColor) await this.branding.change(dto.slug, { color: dto.brandColor });
    await this.audit.record(admin.id, 'company.create', result.company.companyId, { slug: dto.slug });
    return {
      companyId: result.company.companyId,
      administrator: { username: result.administrator.username, password },
    };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(
    @CurrentPlatformAdmin() admin: AuthenticatedPlatformAdmin,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePlatformCompanyDto,
  ): Promise<void> {
    const { brandColor, ...rest } = dto;
    await this.companies.update(id, rest);
    if (brandColor !== undefined) {
      await this.branding.change(await this.companies.slugOf(id), { color: brandColor });
    }
    await this.audit.record(admin.id, 'company.update', id, { ...dto });
  }

  @Post(':id/logo')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseInterceptors(FileInterceptor('logo', { limits: { fileSize: 512 * 1024 } }))
  async logo(
    @CurrentPlatformAdmin() admin: AuthenticatedPlatformAdmin,
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() logo?: Upload,
  ): Promise<void> {
    if (!logo) throw new BadRequestException('Adjunta el logo.');
    await this.branding.change(await this.companies.slugOf(id), { logo });
    await this.audit.record(admin.id, 'company.brand', id, { logo: true });
  }

  @Post(':id/admin-password')
  async resetAdminPassword(
    @CurrentPlatformAdmin() admin: AuthenticatedPlatformAdmin,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<IssuedCredential> {
    const credential = await this.companies.resetAdministratorPassword(id);
    await this.audit.record(admin.id, 'company.admin-password', id, { username: credential.username });
    return credential;
  }
}
