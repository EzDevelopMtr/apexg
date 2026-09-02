import { Module } from '@nestjs/common';

import { InitialAdministratorService } from './initial-administrator.service.js';
import { PasswordHasherService } from './password-hasher.service.js';

/**
 * Autenticación — fase 1: hashing de contraseñas y creación segura del
 * primer usuario Administrador. Sin controllers, sin login, sin JWT.
 * No ejecuta nada al inicializarse.
 */
@Module({
  providers: [PasswordHasherService, InitialAdministratorService],
  exports: [PasswordHasherService, InitialAdministratorService],
})
export class AuthModule {}
