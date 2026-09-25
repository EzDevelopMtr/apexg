import {
  Body,
  Controller,
  Get,
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

// Value imports: DI y validación de @Body()/@Query() necesitan la clase real
// en tiempo de ejecución (ver la nota en access-token.guard.ts).
import { CreateContributionDto } from './create-contribution.dto.js';
import { CreateSavingsPocketDto } from './create-savings-pocket.dto.js';
import { ListContributionsQueryDto } from './list-contributions-query.dto.js';
import { SavingsService } from './savings.service.js';
import type {
  SavingsContributionResult,
  SavingsPocketResult,
} from './savings.types.js';
import { UpdateSavingsPocketDto } from './update-savings-pocket.dto.js';

/**
 * Bolsillos de ahorro.
 *
 * Crear y abonar exige `finanzas.create`, que solo tiene Administrador:
 * cuánto de la utilidad se aparta y para qué es decisión de dueño. Leer va
 * con `finanzas.read`, igual que el resto del módulo.
 *
 * No hay DELETE: un bolsillo se cierra (`PATCH { closed: true }`) y conserva
 * su historial de aportes, que son registros financieros (RNF-07).
 */
@Controller()
@UseGuards(AccessTokenGuard, PermissionGuard)
export class SavingsController {
  constructor(private readonly savings: SavingsService) {}

  @Post('savings-pockets')
  @RequirePermissions('finanzas.create')
  createPocket(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateSavingsPocketDto,
  ): Promise<SavingsPocketResult> {
    return this.savings.createPocket(user.companyId, user.id, dto);
  }

  @Get('savings-pockets')
  @RequirePermissions('finanzas.read')
  listPockets(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SavingsPocketResult[]> {
    return this.savings.listPockets(user.companyId);
  }

  @Patch('savings-pockets/:id')
  @RequirePermissions('finanzas.update')
  updatePocket(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSavingsPocketDto,
  ): Promise<SavingsPocketResult> {
    return this.savings.updatePocket(user.companyId, id, dto);
  }

  @Post('savings-pockets/:id/contributions')
  @RequirePermissions('finanzas.create')
  contribute(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateContributionDto,
  ): Promise<SavingsContributionResult> {
    return this.savings.contribute(user.companyId, user.id, id, dto);
  }

  @Get('savings-contributions')
  @RequirePermissions('finanzas.read')
  listContributions(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListContributionsQueryDto,
  ): Promise<SavingsContributionResult[]> {
    return this.savings.listContributions(user.companyId, {
      pocketId: query.pocketId,
      from: query.from,
      to: query.to,
    });
  }
}
