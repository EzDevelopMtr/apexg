import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

const NONNEGATIVE_QUANTITY_PATTERN = /^\d+(\.\d{1,3})?$/;

/** Body de `POST /inventory-items` (RF-28, RF-29). */
export class CreateInventoryItemDto {
  @IsString()
  @MaxLength(150)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  /**
   * Texto libre: la tabla no tiene un CHECK de catálogo cerrado. El
   * frontend sugiere una lista (unidad/caja/kilogramo/litro/paquete) pero
   * eso es una decisión de UI, no una restricción de la base de datos.
   */
  @IsString()
  @MaxLength(30)
  unitOfMeasure!: string;

  /** RF-28: existencia con la que se registra el ítem. 0 si se omite. */
  @IsOptional()
  @IsString()
  @Matches(NONNEGATIVE_QUANTITY_PATTERN, {
    message: 'initialStock debe ser un número válido (hasta 3 decimales), p. ej. "50.000".',
  })
  initialStock?: string;

  /** RF-29. 0 si se omite. */
  @IsOptional()
  @IsString()
  @Matches(NONNEGATIVE_QUANTITY_PATTERN, {
    message: 'minimumStock debe ser un número válido (hasta 3 decimales), p. ej. "10.000".',
  })
  minimumStock?: string;
}
