import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

import type { DurationUnit } from './membership-types.types.js';

const MONEY_MESSAGE = 'debe ser un monto válido (ej. "65000.00")';

/**
 * Body de `POST /membership-types` (RF-12).
 *
 * `state` no forma parte del alta: un plan nuevo siempre empieza activo
 * (default de la columna). Las invariantes que cruzan varios campos
 * (abono mínimo ≤ precio, reparto = precio, promos sin abono) se validan
 * en el servicio, no aquí — dependen de la combinación completa.
 */
export class CreateMembershipTypeDto {
  @IsString()
  @MaxLength(100)
  name!: string;

  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, { message: `price ${MONEY_MESSAGE}` })
  price!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(1)
  durationValue!: number;

  @IsIn(['day', 'week', 'month'])
  durationUnit!: DurationUnit;

  @IsOptional()
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, { message: `minimumPayment ${MONEY_MESSAGE}` })
  minimumPayment?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, { message: `trainerShare ${MONEY_MESSAGE}` })
  trainerShare?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, { message: `businessShare ${MONEY_MESSAGE}` })
  businessShare?: string;

  @IsOptional()
  @IsBoolean()
  allowsPartialPayment?: boolean;

  @IsOptional()
  @IsBoolean()
  isPromotional?: boolean;
}
