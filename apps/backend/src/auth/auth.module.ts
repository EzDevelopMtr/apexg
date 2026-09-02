import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { AccessTokenGuard } from './access-token.guard.js';
import { AuthController } from './auth.controller.js';
import { AuthorizationService } from './authorization.service.js';
import {
  ACCESS_TOKEN_ALGORITHM,
  ACCESS_TOKEN_EXPIRES_IN,
  JWT_ACCESS_SECRET_ENV,
} from './auth.types.js';
import { InitialAdministratorService } from './initial-administrator.service.js';
import { LoginService } from './login.service.js';
import { PasswordHasherService } from './password-hasher.service.js';
import { PermissionGuard } from './permission.guard.js';

/**
 * Autenticación.
 *  - fase 1: `PasswordHasherService`, `InitialAdministratorService`
 *            (hashing + creación del primer Administrador; sin HTTP).
 *  - fase 2: `LoginService` + `POST /auth/login` (access token JWT, 15 min).
 *  - fase 3: `AccessTokenGuard` + `GET /auth/me`.
 *  - infraestructura de autorización: `AuthorizationService` + `PermissionGuard`.
 *
 * Sin refresh tokens; los guards de permisos se aplicarán por ruta de negocio.
 * `JWT_ACCESS_SECRET` es obligatorio: `getOrThrow` impide arrancar sin él.
 */
@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>(JWT_ACCESS_SECRET_ENV),
        signOptions: {
          algorithm: ACCESS_TOKEN_ALGORITHM,
          expiresIn: ACCESS_TOKEN_EXPIRES_IN,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    PasswordHasherService,
    InitialAdministratorService,
    LoginService,
    AccessTokenGuard,
    AuthorizationService,
    PermissionGuard,
  ],
  exports: [
    PasswordHasherService,
    InitialAdministratorService,
    LoginService,
    AccessTokenGuard,
    AuthorizationService,
    PermissionGuard,
  ],
})
export class AuthModule {}
