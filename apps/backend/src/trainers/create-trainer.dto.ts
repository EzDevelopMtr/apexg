import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

/** Body de `POST /trainers` (RF-22). Solo alcanza a lo que la tabla soporta. */
export class CreateTrainerDto {
  @IsString()
  @MaxLength(150)
  fullName!: string;

  @IsString()
  @MaxLength(50)
  documentNumber!: string;

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

  /** RF-22: "certificados si aplica" — texto libre. */
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  certifications?: string;
}
