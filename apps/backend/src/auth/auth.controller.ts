import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

import type { LoginResult } from './auth.types.js';
import { LoginDto } from './login.dto.js';
import { LoginService } from './login.service.js';

/**
 * Rutas de autenticación. Fase 2: solo `POST /auth/login`.
 *
 * La creación del primer Administrador (`InitialAdministratorService`) es un
 * bootstrap interno y NO se expone por HTTP.
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly loginService: LoginService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto): Promise<LoginResult> {
    return this.loginService.login(dto);
  }
}
