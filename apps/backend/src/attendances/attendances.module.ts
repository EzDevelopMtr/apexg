import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module.js";

import { AttendancesController } from "./attendances.controller.js";
import { AttendancesService } from "./attendances.service.js";

/** Control de ingreso al gimnasio. */
@Module({
  imports: [AuthModule],
  controllers: [AttendancesController],
  providers: [AttendancesService],
})
export class AttendancesModule {}
