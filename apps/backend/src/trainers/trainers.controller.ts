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

// Value imports: DI (TrainersService, TrainerCommissionService) and
// @Body()/@Query() DTOs need the real class at runtime (see the note in
// access-token.guard.ts).
import { CreateTrainerDto } from './create-trainer.dto.js';
import { ListTrainersQueryDto } from './list-trainers-query.dto.js';
import { TrainerCommissionService } from './trainer-commission.service.js';
import { TrainersService } from './trainers.service.js';
import { UpdateTrainerDto } from './update-trainer.dto.js';
import type {
  CommissionRecord,
  TrainerPickerResult,
  TrainerResult,
} from './trainers.types.js';

/**
 * RF-22 a RF-25. `GET` está disponible con `entrenadores.read`, que
 * ambos roles tienen — la proyección (con o sin salario) se decide dentro
 * del servicio según si el caller además tiene `entrenadores.update`.
 */
@Controller('trainers')
@UseGuards(AccessTokenGuard, PermissionGuard)
export class TrainersController {
  constructor(
    private readonly trainers: TrainersService,
    private readonly commissions: TrainerCommissionService,
  ) {}

  @Post()
  @RequirePermissions('entrenadores.create')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateTrainerDto,
  ): Promise<TrainerResult> {
    return this.trainers.create(user.companyId, dto);
  }

  @Get()
  @RequirePermissions('entrenadores.read')
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListTrainersQueryDto,
  ): Promise<readonly (TrainerPickerResult | TrainerResult)[]> {
    return this.trainers.findAll(user.companyId, user.roleId, {
      state: query.state as 1 | 2 | undefined,
    });
  }

  @Get(':id')
  @RequirePermissions('entrenadores.read')
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<TrainerPickerResult | TrainerResult> {
    return this.trainers.findOne(user.companyId, user.roleId, id);
  }

  @Get(':id/commissions')
  @RequirePermissions('entrenadores.read')
  listCommissions(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CommissionRecord[]> {
    return this.commissions.listFor(user.companyId, id);
  }

  @Post(':id/commissions/:commissionId/settle')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('entrenadores.update')
  async settleCommission(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('commissionId', ParseUUIDPipe) commissionId: string,
  ): Promise<void> {
    await this.commissions.settle(user.companyId, id, commissionId);
  }

  @Patch(':id')
  @RequirePermissions('entrenadores.update')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTrainerDto,
  ): Promise<TrainerResult> {
    return this.trainers.update(user.companyId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('entrenadores.delete')
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.trainers.remove(user.companyId, id);
  }
}
