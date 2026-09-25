import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module.js";

import { ClientMembershipService } from "./client-membership.service.js";
import { ClientPhotoService } from "./client-photo.service.js";
import { ClientMembershipLookupService } from "./client-membership-lookup.service.js";
import { ClientsQueryService } from "./clients-query.service.js";
import { ClientRenewalService } from "./client-renewal.service.js";
import { ClientOverdueSyncService } from "./client-overdue-sync.service.js";
import { ClientsController } from "./clients.controller.js";
import { ClientsService } from "./clients.service.js";

/**
 * Módulo de negocio Clientes (RF-04 a RF-08, SRS §4.5).
 *
 * Importa `AuthModule` para reutilizar `AccessTokenGuard` y
 * `PermissionGuard` — no se redefine autenticación ni autorización aquí.
 * Exporta `ClientOverdueSyncService` además de `ClientsService`: Finanzas
 * lo necesita directamente (RF-35), no a través de todo `ClientsService`.
 */
@Module({
  imports: [AuthModule],
  controllers: [ClientsController],
  providers: [
    ClientsService,
    ClientMembershipService,
    ClientOverdueSyncService,
    ClientRenewalService,
    ClientMembershipLookupService,
    ClientsQueryService,
    ClientPhotoService,
  ],
  exports: [ClientsService, ClientOverdueSyncService],
})
export class ClientsModule {}
