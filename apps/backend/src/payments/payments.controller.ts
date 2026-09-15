import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { AccessTokenGuard } from '../auth/access-token.guard.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { PermissionGuard } from '../auth/permission.guard.js';
import { RequirePermissions } from '../auth/require-permissions.decorator.js';

// Value imports: DI (PaymentsService) and @Body()/@Query() DTOs need the
// real class at runtime (see the note in access-token.guard.ts).
import { CreatePaymentDto } from './create-payment.dto.js';
import { ListPaymentsQueryDto } from './list-payments-query.dto.js';
import { PaymentsService } from './payments.service.js';
import type { PaymentResult } from './payments.types.js';

/**
 * RF-17 a RF-20. Sin rutas de edición ni borrado (RNF-07): el catálogo de
 * permisos no define `pagos.update` ni `pagos.delete`, así que ni siquiera
 * el Administrador podría tener ese permiso sin una migración de seeds.
 */
@Controller('payments')
@UseGuards(AccessTokenGuard, PermissionGuard)
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post()
  @RequirePermissions('pagos.create')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePaymentDto,
  ): Promise<PaymentResult> {
    return this.payments.create(user.companyId, user.id, dto);
  }

  @Get()
  @RequirePermissions('pagos.read')
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListPaymentsQueryDto,
  ): Promise<PaymentResult[]> {
    return this.payments.findAll(user.companyId, {
      clientMembershipId: query.clientMembershipId,
    });
  }

  @Get(':id')
  @RequirePermissions('pagos.read')
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PaymentResult> {
    return this.payments.findOne(user.companyId, id);
  }
}
