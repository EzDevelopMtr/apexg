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

// Value imports (not `import type`): NestJS needs the real class at runtime
// for both DI (ClientsService) and `@Body()`/`@Query()` DTO validation and
// transformation (the rest) — `import type` erases the class, silently
// disabling validation or breaking dependency resolution at startup.
import { ClientPhotoService } from "./client-photo.service.js";
import { ClientsService } from "./clients.service.js";
import { ChangeMembershipDto } from "./change-membership.dto.js";
import { CreateClientDto } from "./create-client.dto.js";
import { ListClientsQueryDto } from "./list-clients-query.dto.js";
import { UpdateClientDto } from "./update-client.dto.js";
import type { ClientResult } from "./clients.types.js";

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

/**
 * Lo único que usamos de multer.
 *
 * Declarado aquí en vez de depender del namespace ambiente `Express.Multer`,
 * que exige tener esos @types cargados globalmente y deja de resolver en
 * silencio si alguien ajusta `types` en el tsconfig.
 */
interface UploadedPhoto {
  mimetype: string;
  size: number;
  buffer: Buffer;
}

/**
 * RF-04 a RF-08, SRS §4.5. Primer módulo de negocio con autorización real:
 * `AccessTokenGuard` autentica, `PermissionGuard` exige el código de
 * `permissions` que declare cada ruta con `@RequirePermissions`.
 */
@Controller("clients")
@UseGuards(AccessTokenGuard, PermissionGuard)
export class ClientsController {
  constructor(
    private readonly clients: ClientsService,
    private readonly photos: ClientPhotoService,
  ) {}

  /**
   * La foto viaja en la MISMA petición que el cliente.
   *
   * En dos llamadas, un fallo en la segunda dejaría clientes a medias y
   * archivos huérfanos que nadie volvería a mirar.
   */
  @Post()
  @RequirePermissions("clientes.create")
  @UseInterceptors(
    FileInterceptor("photo", { limits: { fileSize: MAX_PHOTO_BYTES } }),
  )
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateClientDto,
    @UploadedFile() photo?: UploadedPhoto,
  ): Promise<ClientResult> {
    const photoPath = photo ? await this.photos.store(photo) : null;
    try {
      return await this.clients.create(user.companyId, user.id, dto, photoPath);
    } catch (error) {
      // El archivo ya está en disco pero el cliente no llegó a existir.
      if (photoPath) await this.photos.discard(photoPath);
      throw error;
    }
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
  @UseInterceptors(
    FileInterceptor("photo", { limits: { fileSize: MAX_PHOTO_BYTES } }),
  )
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateClientDto,
    @UploadedFile() photo?: UploadedPhoto,
  ): Promise<ClientResult> {
    // Sin archivo se pasa `undefined`, no `null`: editar el teléfono de un
    // cliente no puede borrarle la foto de paso.
    if (!photo) {
      return this.clients.update(user.companyId, id, dto);
    }

    const previous = await this.clients.photoPathOf(user.companyId, id);
    const photoPath = await this.photos.store(photo);
    let updated: ClientResult;
    try {
      updated = await this.clients.update(user.companyId, id, dto, photoPath);
    } catch (error) {
      await this.photos.discard(photoPath);
      throw error;
    }

    // La anterior se borra DESPUÉS de que la base confirme la nueva: al revés,
    // un fallo al guardar dejaría al cliente apuntando a un archivo que ya no
    // está, y la foto no se podría recuperar.
    if (previous) await this.photos.discard(previous);
    return updated;
  }

  /**
   * Sirve la foto tras comprobar que el cliente es de ESTA empresa. Por eso no
   * vive en una carpeta estática: es la cara de una persona.
   */
  @Get(":id/photo")
  @RequirePermissions("clientes.read")
  async findPhoto(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const photoPath = await this.clients.photoPathOf(user.companyId, id);
    const { stream, contentType } = this.photos.openPhoto(photoPath ?? "");
    response.setHeader("Content-Type", contentType);
    response.setHeader("Cache-Control", "private, max-age=300");

    // `StreamableFile` y no `stream.pipe(response)`: con `passthrough: true`
    // Nest cierra la respuesta al volver del handler, así que el pipe manual
    // devolvía 200 con las cabeceras correctas y CERO bytes.
    return new StreamableFile(stream);
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
