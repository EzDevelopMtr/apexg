import {
  IsIn,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
} from "class-validator";

import type { PaymentMethod } from "./payments.types.js";

/**
 * Body de `POST /payments` (RF-17).
 *
 * El pago se registra contra una membresía concreta (`clientMembershipId`),
 * no contra un cliente directamente: un cliente puede tener varias
 * membresías en su historial, y el saldo se calcula por membresía.
 *
 * Sin `PATCH`/`DELETE` en este módulo (RNF-07: los registros financieros
 * son de solo-anexado) — confirmado además por el catálogo de permisos,
 * que no define `pagos.update` ni `pagos.delete`.
 */
export class CreatePaymentDto {
  @IsUUID()
  clientMembershipId!: string;

  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: 'amount debe ser un monto válido (ej. "65000.00")',
  })
  amount!: string;

  @IsIn(["cash", "card", "transfer", "nequi", "bancolombia"])
  paymentMethod!: PaymentMethod;

  /** `paid_at` es TIMESTAMPTZ; por defecto el momento del registro. */
  @IsOptional()
  @IsISO8601()
  paidAt?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
