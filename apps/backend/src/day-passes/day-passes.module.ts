import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module.js";
import { PaymentReceiptService } from "../payments/payment-receipt.service.js";

import { DayPassesController } from "./day-passes.controller.js";
import { DayPassesService } from "./day-passes.service.js";

/** Pases de día para visitantes — ver migración 018. */
@Module({
  imports: [AuthModule],
  controllers: [DayPassesController],
  providers: [DayPassesService, PaymentReceiptService],
})
export class DayPassesModule {}
