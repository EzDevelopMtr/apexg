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
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';

import { AccessTokenGuard } from '../auth/access-token.guard.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { PermissionGuard } from '../auth/permission.guard.js';
import { RequirePermissions } from '../auth/require-permissions.decorator.js';
import { PaymentReceiptService } from '../payments/payment-receipt.service.js';
import type { UploadedFile as Upload } from '../shared/local-file-store.js';

// Value imports: DI (TrainersService, TrainerCommissionService) and
// @Body()/@Query() DTOs need the real class at runtime (see the note in
// access-token.guard.ts).
import { CreateTrainerDto } from './create-trainer.dto.js';
import { ListTrainersQueryDto } from './list-trainers-query.dto.js';
import { SettleCommissionsDto } from './settle-commissions.dto.js';
import { TrainerCommissionService } from './trainer-commission.service.js';
import { TrainerSettlementService } from './trainer-settlement.service.js';
import { TrainersService } from './trainers.service.js';
import { UpdateTrainerDto } from './update-trainer.dto.js';
import type { CommissionRecord, TrainerPickerResult, TrainerResult } from './trainers.types.js';

const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;

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
    private readonly settlements: TrainerSettlementService,
    private readonly receipts: PaymentReceiptService,
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

  /** Un pago al entrenador = un comprobante para todas las comisiones que cubre. */
  @Post(':id/commissions/settle')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('entrenadores.update')
  @UseInterceptors(FileInterceptor('receipt', { limits: { fileSize: MAX_RECEIPT_BYTES } }))
  async settleCommissions(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SettleCommissionsDto,
    @UploadedFile() receipt?: Upload,
  ): Promise<void> {
    const receiptPath = await this.receipts.storeFor(dto.paymentMethod, user.companyId, receipt);
    try {
      await this.settlements.settle(user.companyId, id, dto, receiptPath);
    } catch (error) {
      if (receiptPath) await this.receipts.discard(receiptPath);
      throw error;
    }
  }

  @Get(':id/commissions/:commissionId/receipt')
  @RequirePermissions('entrenadores.read')
  async findCommissionReceipt(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('commissionId', ParseUUIDPipe) commissionId: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const name = await this.settlements.receiptOf(user.companyId, id, commissionId);
    const { stream, contentType } = this.receipts.openReceipt(name);
    response.setHeader('Content-Type', contentType);
    response.setHeader('Cache-Control', 'private, no-store');
    return new StreamableFile(stream);
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
