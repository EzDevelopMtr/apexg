import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CurrentPlatformAdmin } from './current-platform-admin.decorator.js';
// Value imports: DI and DTO validation need the real classes at runtime.
import { PlatformAuditService } from './platform-audit.service.js';
import type { IssuedCredential } from './platform-companies.types.js';
import { PlatformTokenGuard } from './platform-token.guard.js';
import { CreatePlatformUserDto, UpdatePlatformUserDto } from './platform-users.types.js';
import type { PlatformRoleRow, PlatformUserRow } from './platform-users.types.js';
import { PlatformUsersService } from './platform-users.service.js';
import type { AuthenticatedPlatformAdmin } from './platform.types.js';

/** Usuarios y perfiles de un gimnasio, desde el panel. Cada cambio queda auditado. */
@Controller('platform/companies/:companyId')
@UseGuards(PlatformTokenGuard)
export class PlatformUsersController {
  constructor(
    private readonly users: PlatformUsersService,
    private readonly audit: PlatformAuditService,
  ) {}

  @Get('users')
  list(@Param('companyId', ParseUUIDPipe) companyId: string): Promise<PlatformUserRow[]> {
    return this.users.list(companyId);
  }

  @Get('roles')
  roles(@Param('companyId', ParseUUIDPipe) companyId: string): Promise<PlatformRoleRow[]> {
    return this.users.roles(companyId);
  }

  @Post('users')
  async create(
    @CurrentPlatformAdmin() admin: AuthenticatedPlatformAdmin,
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Body() dto: CreatePlatformUserDto,
  ): Promise<{ user: PlatformUserRow; credential: IssuedCredential }> {
    const result = await this.users.create(companyId, dto);
    await this.audit.record(admin.id, 'user.create', companyId, {
      userId: result.user.id,
      username: result.user.username,
      role: result.user.roleName,
    });
    return result;
  }

  @Patch('users/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(
    @CurrentPlatformAdmin() admin: AuthenticatedPlatformAdmin,
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: UpdatePlatformUserDto,
  ): Promise<void> {
    await this.users.update(companyId, userId, dto);
    await this.audit.record(admin.id, 'user.update', companyId, { userId, ...dto });
  }

  @Post('users/:userId/password')
  async resetPassword(
    @CurrentPlatformAdmin() admin: AuthenticatedPlatformAdmin,
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<IssuedCredential> {
    const credential = await this.users.resetPassword(companyId, userId);
    await this.audit.record(admin.id, 'user.password', companyId, { userId, username: credential.username });
    return credential;
  }
}
