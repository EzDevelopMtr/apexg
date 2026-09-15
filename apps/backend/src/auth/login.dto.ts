import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

import type { LoginInput } from './auth.types.js';

/**
 * Body de `POST /auth/login`. Con el ValidationPipe global
 * (`whitelist` + `forbidNonWhitelisted`) se rechaza cualquier campo extra.
 *
 * `password` NO se recorta ni normaliza aquí: se valida solo que no esté
 * vacío; el `LoginService` lo compara textualmente.
 */
export class LoginDto implements LoginInput {
  @IsUUID()
  companyId!: string;

  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}
