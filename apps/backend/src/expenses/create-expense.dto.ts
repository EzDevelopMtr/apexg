import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

import type { PaymentMethod } from '../payments/payments.types.js';

/**
 * Body de `POST /expenses` (RF-26). Llega como JSON o, con comprobante, como
 * multipart: todos los campos ya son texto, así que valen igual en ambos.
 */
export class CreateExpenseDto {
  @IsUUID()
  categoryId!: string;

  @IsString()
  @MaxLength(200)
  concept!: string;

  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: 'amount debe ser un monto válido (ej. "420000.00")',
  })
  amount!: string;

  /** Por defecto hoy si se omite. */
  @IsOptional()
  @IsDateString()
  expenseDate?: string;

  /** Obligatorio en egresos nuevos; el comprobante lo exige si no es efectivo. */
  @IsIn(['cash', 'transfer'])
  paymentMethod!: PaymentMethod;
}
