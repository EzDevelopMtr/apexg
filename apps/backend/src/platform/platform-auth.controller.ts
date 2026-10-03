import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';

import { CurrentPlatformAdmin } from './current-platform-admin.decorator.js';
// Value imports: DI and DTO validation need the real classes at runtime.
import { PlatformAuthService } from './platform-auth.service.js';
import { PlatformLoginDto } from './platform-company.dto.js';
import { PlatformTokenGuard } from './platform-token.guard.js';
import type { AuthenticatedPlatformAdmin, PlatformLoginResult } from './platform.types.js';

/** Sesión del super admin. El alta del primero es por comando (`platform:create-admin`). */
@Controller('platform/auth')
export class PlatformAuthController {
  constructor(private readonly auth: PlatformAuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: PlatformLoginDto): Promise<PlatformLoginResult> {
    return this.auth.login(dto.email, dto.password);
  }

  @Get('me')
  @UseGuards(PlatformTokenGuard)
  me(@CurrentPlatformAdmin() admin: AuthenticatedPlatformAdmin): AuthenticatedPlatformAdmin {
    return admin;
  }
}
