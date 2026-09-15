import { IsIn, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

const NONNEGATIVE_QUANTITY_PATTERN = /^\d+(\.\d{1,3})?$/;

/**
 * Body de `PATCH /inventory-items/:id`. `currentStock` no es editable
 * aquí a propósito: solo cambia a través de `POST .../movements`, para que
 * `inventory_movements` sea el único historial de cada cambio de existencias.
 */
export class UpdateInventoryItemDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  unitOfMeasure?: string;

  @IsOptional()
  @IsString()
  @Matches(NONNEGATIVE_QUANTITY_PATTERN, {
    message: 'minimumStock debe ser un número válido (hasta 3 decimales), p. ej. "10.000".',
  })
  minimumStock?: string;

  @IsOptional()
  @IsIn([1, 2])
  state?: 1 | 2;
}
