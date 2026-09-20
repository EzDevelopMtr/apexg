import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from "class-validator";

import type { DurationUnit } from "./membership-types.types.js";

const MONEY_MESSAGE = 'debe ser un monto válido (ej. "65000.00")';

/**
 * Body de `PATCH /membership-types/:id` (RF-12).
 *
 * Semántica de PATCH: un campo **ausente** deja el valor actual sin
 * tocar; un campo enviado como `null` LIMPIA el valor (relevante para
 * `description`, `minimumPayment`, `trainerShare`, `businessShare`, que
 * son nullable). `@IsOptional()` de class-validator no valida cuando el
 * valor es `null`, así que este mismo decorador cubre ambos casos.
 *
 * El servicio revalida la combinación completa (existente + patch) con
 * las mismas reglas de `CreateMembershipTypeDto` — cambiar `price` en un
 * plan con `trainerShare`/`businessShare` ya fijados debe seguir cuadrando.
 */
export class UpdateMembershipTypeDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, { message: `price ${MONEY_MESSAGE}` })
  price?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationValue?: number;

  @IsOptional()
  @IsIn(["day", "week", "month"])
  durationUnit?: DurationUnit;

  @IsOptional()
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, { message: `minimumPayment ${MONEY_MESSAGE}` })
  minimumPayment?: string | null;

  @IsOptional()
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, { message: `trainerShare ${MONEY_MESSAGE}` })
  trainerShare?: string | null;

  @IsOptional()
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, { message: `businessShare ${MONEY_MESSAGE}` })
  businessShare?: string | null;

  @IsOptional()
  @IsBoolean()
  allowsPartialPayment?: boolean;

  @IsOptional()
  @IsBoolean()
  isPromotional?: boolean;

  /**
   * Días que el plan permite por semana. Ausente o null = sin tope.
   *
   * Hasta 6 porque el gimnasio no abre domingos: una semana completa son seis
   * días de acceso. El formulario ofrece una lista, pero la API tiene que
   * rechazar lo mismo — si no, la restricción solo vale mientras se use
   * nuestra pantalla.
   */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(6)
  weeklyVisits?: number;

  @IsOptional()
  @IsIn([1, 2])
  state?: 1 | 2;
}
