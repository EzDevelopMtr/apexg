import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module.js";

import { ClientRemindersController } from "./client-reminders.controller.js";
import { ClientRemindersService } from "./client-reminders.service.js";

/** Recordatorios de renovación por WhatsApp. */
@Module({
  imports: [AuthModule],
  controllers: [ClientRemindersController],
  providers: [ClientRemindersService],
})
export class ClientRemindersModule {}
