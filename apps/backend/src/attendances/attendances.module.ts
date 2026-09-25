import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module.js";

import { AttendanceQueryService } from "./attendance-query.service.js";
import { AttendancesController } from "./attendances.controller.js";
import { AttendancesService } from "./attendances.service.js";
import { CheckInGuardService } from "./check-in-guard.service.js";

/** Control de ingreso al gimnasio. */
@Module({
  imports: [AuthModule],
  controllers: [AttendancesController],
  providers: [
    AttendancesService,
    AttendanceQueryService,
    CheckInGuardService,
  ],
})
export class AttendancesModule {}
