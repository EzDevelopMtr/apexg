import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';

import { AccessTokenGuard } from './access-token.guard.js';
import type { AuthenticatedUser, LoginResult } from './auth.types.js';
import { CurrentUser } from './current-user.decorator.js';
import { LoginDto } from './login.dto.js';
import { LoginService } from './login.service.js';

/**
 * Rutas de autenticación. `POST /auth/login` es público; `GET /auth/me`
 * requiere un access token válido.
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

  @Get('me')
  @UseGuards(AccessTokenGuard)
  me(@CurrentUser() user: AuthenticatedUser): AuthenticatedUser {
    return user;
  }
}
