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
import type {
  AuthenticatedUser,
  LoginResult,
  RenewedToken,
} from './auth.types.js';
import { CurrentUser } from './current-user.decorator.js';
// Value imports (not `import type`): NestJS needs the real class at runtime
// for both DI (LoginService, constructor-injected) and `@Body()` DTO
// validation/transformation (LoginDto) — `import type` erases the class,
// and Nest silently stops validating or fails to resolve the dependency.
import { LoginDto } from './login.dto.js';
import { LoginService } from './login.service.js';
import { TokenRenewalService } from './token-renewal.service.js';

/**
 * Rutas de autenticación. `POST /auth/login` es público; `GET /auth/me`
 * requiere un access token válido.
 *
 * La creación del primer Administrador (`InitialAdministratorService`) es un
 * bootstrap interno y NO se expone por HTTP.
 */
@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginService: LoginService,
    private readonly renewal: TokenRenewalService,
  ) {}

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

  /**
   * Cambia un token vigente por otro con los 15 minutos completos.
   *
   * Lo pide el navegador mientras la pestaña está abierta. El guard exige que
   * el token actual siga siendo válido, así que esto alarga una sesión viva,
   * nunca resucita una caducada.
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AccessTokenGuard)
  refresh(@CurrentUser() user: AuthenticatedUser): Promise<RenewedToken> {
    return this.renewal.renew(user);
  }
}
