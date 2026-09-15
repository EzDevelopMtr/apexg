import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * Body de `PATCH /trainers/:id` (RF-22).
 *
 * `documentNumber` no se edita aquí, igual que `clients.documentNumber`:
 * un identificador no cambia por un PATCH genérico.
 */
export class UpdateTrainerDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  fullName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsDateString()
  hiredAt?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: 'salary debe ser un monto válido (ej. "1800000.00")',
  })
  salary?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxClients?: number;

  @IsOptional()
  @IsIn([1, 2])
  state?: 1 | 2;

  /** RF-22: "certificados si aplica" — texto libre. */
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  certifications?: string;
}
