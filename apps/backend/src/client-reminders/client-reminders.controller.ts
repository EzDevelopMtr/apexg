import { Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from "@nestjs/common";

import { AccessTokenGuard } from "../auth/access-token.guard.js";
import type { AuthenticatedUser } from "../auth/auth.types.js";
import { CurrentUser } from "../auth/current-user.decorator.js";
import { PermissionGuard } from "../auth/permission.guard.js";
import { RequirePermissions } from "../auth/require-permissions.decorator.js";

// Value import: DI necesita la clase real en runtime.
import { ClientRemindersService } from "./client-reminders.service.js";
import type { LatestReminder } from "./client-reminders.service.js";

/**
 * Recordatorios de renovación por WhatsApp. Basta con ver clientes: quien ve
 * la lista de por vencer es quien les escribe, y registrarlo no cambia al
 * cliente. Sin edición ni borrado, como una asistencia.
 */
@Controller("client-reminders")
@UseGuards(AccessTokenGuard, PermissionGuard)
export class ClientRemindersController {
  constructor(private readonly reminders: ClientRemindersService) {}

  @Get()
  @RequirePermissions("clientes.read")
  latest(@CurrentUser() user: AuthenticatedUser): Promise<LatestReminder[]> {
    return this.reminders.latest(user.companyId);
  }

  @Post(":clientId")
  @RequirePermissions("clientes.read")
  record(
    @CurrentUser() user: AuthenticatedUser,
    @Param("clientId", ParseUUIDPipe) clientId: string,
  ): Promise<LatestReminder> {
    return this.reminders.record(user.companyId, user.id, clientId);
  }
}
