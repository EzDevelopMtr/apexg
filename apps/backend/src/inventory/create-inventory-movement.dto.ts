import { IsIn, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

import type { InventoryMovementType } from './inventory.types.js';

const SIGNED_QUANTITY_PATTERN = /^-?\d+(\.\d{1,3})?$/;

/**
 * Body de `POST /inventory-items/:id/movements`.
 *
 * `quantity` es la magnitud (siempre positiva) para `in`/`out` — el signo
 * lo decide `movementType`. Para `adjustment` es el delta CON SIGNO de una
 * corrección (puede subir o bajar el stock), porque ahí no hay un tipo que
 * ya indique la dirección. El servicio valida el signo según el tipo.
 */
export class CreateInventoryMovementDto {
  @IsIn(['in', 'out', 'adjustment'])
  movementType!: InventoryMovementType;

  @IsString()
  @Matches(SIGNED_QUANTITY_PATTERN, {
    message:
      'quantity debe ser un número válido (hasta 3 decimales), p. ej. "12.500" o "-3.250" para un ajuste.',
  })
  quantity!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;
}
