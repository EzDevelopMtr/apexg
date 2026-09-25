import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Body de `PATCH /savings-pockets/:id`.
 *
 * Todo opcional: `undefined` es "no lo toques". Cerrar un bolsillo es
 * `closed: true`, no un endpoint aparte — es un cambio de estado, y el
 * bolsillo se conserva con su historial.
 */
export class UpdateSavingsPocketDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: 'goalAmount debe ser un monto válido (ej. "3000000.00")',
  })
  goalAmount?: string;

  @IsOptional()
  @IsBoolean()
  closed?: boolean;
}
