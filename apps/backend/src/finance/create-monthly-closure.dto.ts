import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

/**
 * Body de `POST /finance/monthly-closures` (RF-32).
 *
 * El catálogo de permisos solo define `finanzas.read/export` — no hay
 * `finanzas.create`/`update`. Se gatea con `finanzas.read` (ver el
 * controller) porque negar el cierre a quien ya puede leer finanzas sería
 * más raro que exigirle un permiso que no existe. Señalado para
 * `database-architect`/negocio: decidir si el cierre mensual necesita un
 * permiso propio.
 */
export class CreateMonthlyClosureDto {
  @IsInt()
  @Min(2000)
  year!: number;

  @IsInt()
  @Min(1)
  @Max(12)
  month!: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  observations?: string;
}
