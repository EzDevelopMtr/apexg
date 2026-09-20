import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";

import { AccessTokenGuard } from "../auth/access-token.guard.js";
import type { AuthenticatedUser } from "../auth/auth.types.js";
import { CurrentUser } from "../auth/current-user.decorator.js";
import { PermissionGuard } from "../auth/permission.guard.js";
import { RequirePermissions } from "../auth/require-permissions.decorator.js";

// Value imports (not `import type`): NestJS needs the real class at runtime
// for both DI (ClientsService) and `@Body()`/`@Query()` DTO validation and
// transformation (the rest) — `import type` erases the class, silently
// disabling validation or breaking dependency resolution at startup.
import { ClientsService } from "./clients.service.js";
import { ChangeMembershipDto } from "./change-membership.dto.js";
import { CreateClientDto } from "./create-client.dto.js";
import { ListClientsQueryDto } from "./list-clients-query.dto.js";
import { UpdateClientDto } from "./update-client.dto.js";
import type { ClientResult } from "./clients.types.js";

/**
 * RF-04 a RF-08, SRS §4.5. Primer módulo de negocio con autorización real:
 * `AccessTokenGuard` autentica, `PermissionGuard` exige el código de
 * `permissions` que declare cada ruta con `@RequirePermissions`.
 */
@Controller("clients")
@UseGuards(AccessTokenGuard, PermissionGuard)
export class ClientsController {
  constructor(private readonly clients: ClientsService) {}

  @Post()
  @RequirePermissions("clientes.create")
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateClientDto,
  ): Promise<ClientResult> {
    return this.clients.create(user.companyId, user.id, dto);
  }

  @Get()
  @RequirePermissions("clientes.read")
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListClientsQueryDto,
  ): Promise<ClientResult[]> {
    return this.clients.findAll(user.companyId, {
      state: query.state as 1 | 2 | 3 | undefined,
      expiringWithinDays: query.expiringWithinDays,
    });
  }

  @Get(":id")
  @RequirePermissions("clientes.read")
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<ClientResult> {
    return this.clients.findOne(user.companyId, id);
  }

  @Patch(":id")
  @RequirePermissions("clientes.update")
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateClientDto,
  ): Promise<ClientResult> {
    return this.clients.update(user.companyId, id, dto);
  }

  /** SRS §4.5: acción propia, sin body — retirar no exige indicar un motivo. */

  /**
   * Renovar la membresía o cambiarla por otra (RF-08).
   *
   * POST y no PATCH sobre el cliente: no modifica la membresía vigente, abre
   * una nueva. Editar la actual reescribiría contra qué se pagó.
   */
  @Post(":id/memberships")
  @RequirePermissions("clientes.update")
  changeMembership(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: ChangeMembershipDto,
  ): Promise<ClientResult> {
    return this.clients.changeMembership(user.companyId, user.id, id, dto);
  }

  @Post(":id/retire")
  @HttpCode(HttpStatus.OK)
  @RequirePermissions("clientes.update")
  retire(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<ClientResult> {
    return this.clients.retire(user.companyId, id);
  }
}
