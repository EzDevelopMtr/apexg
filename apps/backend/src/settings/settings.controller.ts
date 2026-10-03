import { Controller, Get, UseGuards } from '@nestjs/common';

import { AccessTokenGuard } from '../auth/access-token.guard.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/current-user.decorator.js';

import type { CompanySettings } from './setting-definitions.js';
// Value import: constructor-injected (see the note in access-token.guard.ts).
import { SettingsService } from './settings.service.js';

/** Los ajustes que rigen para el gimnasio de quien pregunta. Solo lectura. */
@Controller('settings')
@UseGuards(AccessTokenGuard)
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  get(@CurrentUser() user: AuthenticatedUser): Promise<CompanySettings> {
    return this.settings.forCompany(user.companyId);
  }
}
