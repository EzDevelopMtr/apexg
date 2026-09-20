import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
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

// Value imports: DI (PaymentsService) and @Body()/@Query() DTOs need the
// real class at runtime (see the note in access-token.guard.ts).
import { CreatePaymentDto } from "./create-payment.dto.js";
import { ListPaymentsQueryDto } from "./list-payments-query.dto.js";
import { PaymentReceiptService } from "./payment-receipt.service.js";
import { PaymentsService } from "./payments.service.js";
import type { PaymentResult } from "./payments.types.js";

const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;

/**
 * Lo único que usamos de multer.
 *
 * Declarado aquí en vez de depender del namespace ambiente
 * `Express.Multer`, que exige tener esos @types cargados globalmente y deja
 * de resolver en silencio si alguien ajusta `types` en el tsconfig.
 */
interface UploadedReceipt {
  mimetype: string;
  size: number;
  buffer: Buffer;
}

/**
 * RF-17 a RF-20. Sin rutas de edición ni borrado (RNF-07): el catálogo de
 * permisos no define `pagos.update` ni `pagos.delete`, así que ni siquiera
 * el Administrador podría tener ese permiso sin una migración de seeds.
 */
@Controller("payments")
@UseGuards(AccessTokenGuard, PermissionGuard)
export class PaymentsController {
  constructor(
    private readonly payments: PaymentsService,
    private readonly receipts: PaymentReceiptService,
  ) {}

  /**
   * El comprobante viaja en la MISMA petición que el pago, no en una segunda
   * llamada: si no, entre las dos existiría un pago electrónico sin evidencia,
   * que es justo lo que la regla prohíbe.
   */
  @Post()
  @RequirePermissions("pagos.create")
  @UseInterceptors(
    FileInterceptor("receipt", { limits: { fileSize: MAX_RECEIPT_BYTES } }),
  )
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePaymentDto,
    @UploadedFile() receipt?: UploadedReceipt,
  ): Promise<PaymentResult> {
    const receiptPath = await this.receipts.storeFor(
      dto.paymentMethod,
      receipt,
    );
    try {
      return await this.payments.create(
        user.companyId,
        user.id,
        dto,
        receiptPath,
      );
    } catch (error) {
      // El archivo ya está en disco pero el pago no llegó a existir: sin esto
      // cada intento fallido dejaría un huérfano que nadie volvería a mirar.
      if (receiptPath) await this.receipts.discard(receiptPath);
      throw error;
    }
  }

  @Get()
  @RequirePermissions("pagos.read")
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListPaymentsQueryDto,
  ): Promise<PaymentResult[]> {
    return this.payments.findAll(user.companyId, {
      clientMembershipId: query.clientMembershipId,
    });
  }

  /**
   * Sirve el archivo tras comprobar que el pago es de ESTA empresa. Por eso no
   * vive en una carpeta estática: un comprobante lleva el dinero de alguien.
   */
  @Get(":id/receipt")
  @RequirePermissions("pagos.read")
  async findReceipt(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const payment = await this.payments.findOne(user.companyId, id);
    const { stream, contentType } = this.receipts.open(
      payment.receiptPath ?? "",
    );
    response.setHeader("Content-Type", contentType);
    response.setHeader("Cache-Control", "private, no-store");
    stream.pipe(response);
  }

  @Get(":id")
  @RequirePermissions("pagos.read")
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<PaymentResult> {
    return this.payments.findOne(user.companyId, id);
  }
}
