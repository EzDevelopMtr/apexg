import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { AccessTokenGuard } from '../auth/access-token.guard.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { PermissionGuard } from '../auth/permission.guard.js';
import { RequirePermissions } from '../auth/require-permissions.decorator.js';

// Value imports: DI (MembershipTypesService) and @Body()/@Query() DTOs need
// the real class at runtime (see the note in access-token.guard.ts).
import { CreateMembershipTypeDto } from './create-membership-type.dto.js';
import { ListMembershipTypesQueryDto } from './list-membership-types-query.dto.js';
import { MembershipTypesService } from './membership-types.service.js';
import { UpdateMembershipTypeDto } from './update-membership-type.dto.js';
import type { MembershipTypeResult } from './membership-types.types.js';

/**
 * RF-12, RF-13. Solo el Administrador tiene `membresias.create/update/delete`
 * (la Recepcionista solo `membresias.read`, ver seed de permisos) — la
 * autorización real está en `role_permissions`, no en este controller.
 */
@Controller('membership-types')
@UseGuards(AccessTokenGuard, PermissionGuard)
export class MembershipTypesController {
  constructor(private readonly membershipTypes: MembershipTypesService) {}

  @Post()
  @RequirePermissions('membresias.create')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateMembershipTypeDto,
  ): Promise<MembershipTypeResult> {
    return this.membershipTypes.create(user.companyId, dto);
  }

  @Get()
  @RequirePermissions('membresias.read')
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListMembershipTypesQueryDto,
  ): Promise<MembershipTypeResult[]> {
    return this.membershipTypes.findAll(user.companyId, {
      state: query.state as 1 | 2 | undefined,
      isPromotional: query.isPromotional,
    });
  }

  @Get(':id')
  @RequirePermissions('membresias.read')
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<MembershipTypeResult> {
    return this.membershipTypes.findOne(user.companyId, id);
  }

  @Patch(':id')
  @RequirePermissions('membresias.update')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMembershipTypeDto,
  ): Promise<MembershipTypeResult> {
    return this.membershipTypes.update(user.companyId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('membresias.delete')
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.membershipTypes.remove(user.companyId, id);
  }
}
