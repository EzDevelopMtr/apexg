import { IsIn, IsISO8601, IsOptional, IsString, IsUUID, Matches } from 'class-validator';

import type { PaymentMethod } from '../payments/payments.types.js';

const POSITIVE_QUANTITY_PATTERN = /^\d+(\.\d{1,3})?$/;
const MONEY_PATTERN = /^\d+(\.\d{1,2})?$/;

/**
 * Body de `POST /product-sales`.
 *
 * Vende un ítem de inventario — no una membresía. `clientId` es opcional
 * (decisión del usuario: una venta de mostrador no siempre tiene cliente).
 * `amount` se escribe a mano: `inventory_items` no tiene precio de venta
 * guardado (decisión del usuario, migración 006).
 */
export class CreateProductSaleDto {
  @IsUUID()
  inventoryItemId!: string;

  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsString()
  @Matches(POSITIVE_QUANTITY_PATTERN, {
    message: 'quantity debe ser un número positivo (hasta 3 decimales), p. ej. "2.000".',
  })
  quantity!: string;

  @IsString()
  @Matches(MONEY_PATTERN, {
    message: 'amount debe ser un monto válido (ej. "8000.00").',
  })
  amount!: string;

  @IsIn(['cash', 'card', 'transfer', 'nequi'])
  paymentMethod!: PaymentMethod;

  /** `sold_at` es TIMESTAMPTZ; por defecto el momento del registro. */
  @IsOptional()
  @IsISO8601()
  soldAt?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
