import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Response } from "express";

import { AccessTokenGuard } from "../auth/access-token.guard.js";
import type { AuthenticatedUser } from "../auth/auth.types.js";
import { CurrentUser } from "../auth/current-user.decorator.js";
import { PermissionGuard } from "../auth/permission.guard.js";
import { RequirePermissions } from "../auth/require-permissions.decorator.js";
import { PaymentReceiptService } from "../payments/payment-receipt.service.js";
import type { UploadedFile as Upload } from "../shared/local-file-store.js";

// Value imports: DI and @Body() DTOs need the real class at runtime (see the
// note in access-token.guard.ts).
import { CreateDayPassDto } from "./create-day-pass.dto.js";
import { DayPassesService } from "./day-passes.service.js";
import type { DayPassResult } from "./day-passes.types.js";

const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;

/**
 * Pases de día. Gateado con `pagos.*` y no con `asistencia.*`: lo que se
 * autoriza es cobrar, y la recepcionista que puede cobrar un plan puede
 * cobrar un día. El comprobante sigue la misma regla y el mismo almacén que
 * el de un pago, para que un visitante no sea la puerta trasera de un cobro
 * electrónico sin evidencia.
 */
@Controller("day-passes")
@UseGuards(AccessTokenGuard, PermissionGuard)
export class DayPassesController {
  constructor(
    private readonly passes: DayPassesService,
    private readonly receipts: PaymentReceiptService,
  ) {}

  @Post()
  @RequirePermissions("pagos.create")
  @UseInterceptors(
    FileInterceptor("receipt", { limits: { fileSize: MAX_RECEIPT_BYTES } }),
  )
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateDayPassDto,
    @UploadedFile() receipt?: Upload,
  ): Promise<DayPassResult> {
    const receiptPath = await this.receipts.storeFor(dto.paymentMethod, receipt);
    try {
      return await this.passes.create(user.companyId, user.id, dto, receiptPath);
    } catch (error) {
      if (receiptPath) await this.receipts.discard(receiptPath);
      throw error;
    }
  }

  @Get()
  @RequirePermissions("pagos.read")
  findAll(@CurrentUser() user: AuthenticatedUser): Promise<DayPassResult[]> {
    return this.passes.findAll(user.companyId);
  }

  @Get(":id/receipt")
  @RequirePermissions("pagos.read")
  async findReceipt(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const pass = await this.passes.findOne(user.companyId, id);
    const { stream, contentType } = this.receipts.openReceipt(pass.receiptPath ?? "");
    response.setHeader("Content-Type", contentType);
    response.setHeader("Cache-Control", "private, no-store");
    return new StreamableFile(stream);
  }
}
