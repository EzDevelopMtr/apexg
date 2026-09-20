import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";

import { AccessTokenGuard } from "../auth/access-token.guard.js";
import type { AuthenticatedUser } from "../auth/auth.types.js";
import { CurrentUser } from "../auth/current-user.decorator.js";
import { PermissionGuard } from "../auth/permission.guard.js";
import { RequirePermissions } from "../auth/require-permissions.decorator.js";

// Value imports: DI y el DTO de @Body() necesitan la clase real en runtime.
import { AttendancesService } from "./attendances.service.js";
import { CreateAttendanceDto } from "./create-attendance.dto.js";
import type {
  AttendanceCandidate,
  AttendanceResult,
} from "./attendances.types.js";

/**
 * Control de ingreso al gimnasio.
 *
 * Sin edición ni borrado: una asistencia es un hecho ocurrido, igual que un
 * pago. La salida no reescribe el ingreso, le añade la hora de salida.
 */
@Controller("attendances")
@UseGuards(AccessTokenGuard, PermissionGuard)
export class AttendancesController {
  constructor(private readonly attendances: AttendancesService) {}

  @Get()
  @RequirePermissions("asistencia.read")
  findToday(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AttendanceResult[]> {
    return this.attendances.findToday(user.companyId);
  }

  @Get("search")
  @RequirePermissions("asistencia.read")
  /**
   * Sin `q` devuelve los primeros clientes, no una lista vacía: el panel abre
   * la lista para que la recepcionista elija sin recordar el nombre.
   *
   * Una sola letra sí se descarta: coincidiría con casi todo el gimnasio y el
   * resultado no ayudaría a nadie.
   */
  search(
    @CurrentUser() user: AuthenticatedUser,
    @Query("q") query = "",
  ): Promise<AttendanceCandidate[]> {
    const text = query.trim();
    return text.length === 1
      ? Promise.resolve([])
      : this.attendances.search(user.companyId, text);
  }

  @Post()
  @RequirePermissions("asistencia.create")
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAttendanceDto,
  ): Promise<AttendanceResult> {
    return this.attendances.create(user.companyId, dto.clientId);
  }

  @Post(":clientId/check-out")
  @RequirePermissions("asistencia.create")
  checkOut(
    @CurrentUser() user: AuthenticatedUser,
    @Param("clientId", ParseUUIDPipe) clientId: string,
  ): Promise<AttendanceResult> {
    return this.attendances.checkOut(user.companyId, clientId);
  }
}
