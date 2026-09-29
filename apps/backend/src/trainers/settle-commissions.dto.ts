import { Transform } from 'class-transformer';
import { ArrayMinSize, ArrayUnique, IsArray, IsIn, IsUUID } from 'class-validator';

import type { PaymentMethod } from '../payments/payments.types.js';

/**
 * Multipart no tiene arreglos: los ids llegan como un JSON (`'["a","b"]'`),
 * como un campo repetido (ya arreglo) o como un solo campo (una cadena).
 * Se normalizan aquí para que el validador vea siempre un arreglo.
 */
function toIdList({ value }: { value: unknown }): unknown {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return value;
  if (value.trim().startsWith('[')) {
    try {
      return JSON.parse(value) as unknown;
    } catch {
      return value;
    }
  }
  return [value];
}

/** Body de `POST /trainers/:id/commissions/settle`: un pago, un comprobante. */
export class SettleCommissionsDto {
  @Transform(toIdList)
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsUUID('all', { each: true })
  commissionIds!: string[];

  @IsIn(['cash', 'transfer'])
  paymentMethod!: PaymentMethod;
}
