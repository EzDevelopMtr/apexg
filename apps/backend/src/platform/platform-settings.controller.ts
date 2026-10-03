import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import { Allow, IsBoolean, IsDefined, IsOptional } from 'class-validator';

import type { SettingOverview } from '../settings/settings.service.js';
// Value import: constructor-injected (see the note in access-token.guard.ts).
import { SettingsService } from '../settings/settings.service.js';

import { CurrentPlatformAdmin } from './current-platform-admin.decorator.js';
import { PlatformTokenGuard } from './platform-token.guard.js';
import type { AuthenticatedPlatformAdmin } from './platform.types.js';

/** El tipo de `value` depende del ajuste: lo valida su definición en el catálogo. */
export class SettingValueDto {
  @IsDefined()
  @Allow()
  value!: unknown;

  @IsOptional()
  @IsBoolean()
  enforced?: boolean;
}

/**
 * Ajustes: el super admin decide, por ajuste, si vale para todos (general,
 * opcionalmente obligatorio) o solo para un gimnasio (excepción).
 */
@Controller('platform/settings')
@UseGuards(PlatformTokenGuard)
export class PlatformSettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  overview(): Promise<SettingOverview[]> {
    return this.settings.overview();
  }

  @Put(':key')
  @HttpCode(HttpStatus.NO_CONTENT)
  setGeneral(
    @CurrentPlatformAdmin() admin: AuthenticatedPlatformAdmin,
    @Param('key') key: string,
    @Body() dto: SettingValueDto,
  ): Promise<void> {
    return this.settings.setPlatform(admin.id, key, dto.value, dto.enforced ?? false);
  }

  @Delete(':key')
  @HttpCode(HttpStatus.NO_CONTENT)
  clearGeneral(@Param('key') key: string): Promise<void> {
    return this.settings.clearPlatform(key);
  }

  @Put(':key/companies/:companyId')
  @HttpCode(HttpStatus.NO_CONTENT)
  setOverride(
    @CurrentPlatformAdmin() admin: AuthenticatedPlatformAdmin,
    @Param('key') key: string,
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Body() dto: SettingValueDto,
  ): Promise<void> {
    return this.settings.setOverride(admin.id, companyId, key, dto.value);
  }

  @Delete(':key/companies/:companyId')
  @HttpCode(HttpStatus.NO_CONTENT)
  clearOverride(
    @Param('key') key: string,
    @Param('companyId', ParseUUIDPipe) companyId: string,
  ): Promise<void> {
    return this.settings.clearOverride(companyId, key);
  }
}
