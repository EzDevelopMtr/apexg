import { IsDateString, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

/**
 * Body de `POST /savings-pockets/:id/contributions`.
 *
 * El monto admite signo: un aporte en contra deshace uno anterior sin borrar
 * nada (RNF-07). Que un aporte normal sea positivo lo decide el dominio.
 */
export class CreateContributionDto {
  @IsString()
  @Matches(/^-?\d+(\.\d{1,2})?$/, {
    message: 'amount debe ser un monto válido (ej. "250000.00" o "-50000.00")',
  })
  amount!: string;

  /** Por defecto hoy si se omite. */
  @IsOptional()
  @IsDateString()
  savedOn?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
