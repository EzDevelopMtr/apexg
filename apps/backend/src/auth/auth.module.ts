import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { AuthController } from './auth.controller.js';
import { ACCESS_TOKEN_EXPIRES_IN, JWT_ACCESS_SECRET_ENV } from './auth.types.js';
import { InitialAdministratorService } from './initial-administrator.service.js';
import { LoginService } from './login.service.js';
import { PasswordHasherService } from './password-hasher.service.js';

/**
 * Autenticación.
 *  - fase 1: `PasswordHasherService`, `InitialAdministratorService`
 *            (hashing + creación del primer Administrador; sin HTTP).
 *  - fase 2: `LoginService` + `POST /auth/login` (access token JWT, 15 min).
 *
 * Sin refresh tokens, sin guards, sin autorización por permiso todavía.
 * `JWT_ACCESS_SECRET` es obligatorio: `getOrThrow` impide arrancar sin él.
 */
@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>(JWT_ACCESS_SECRET_ENV),
        signOptions: { expiresIn: ACCESS_TOKEN_EXPIRES_IN },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [PasswordHasherService, InitialAdministratorService, LoginService],
  exports: [PasswordHasherService, InitialAdministratorService, LoginService],
})
export class AuthModule {}
