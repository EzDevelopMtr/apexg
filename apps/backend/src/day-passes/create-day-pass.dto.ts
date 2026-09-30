import { IsIn, IsString, Matches, MaxLength } from "class-validator";

import type { PaymentMethod } from "../payments/payments.types.js";

/**
 * Body de `POST /day-passes`.
 *
 * El valor lo escribe la recepcionista, como en un egreso: el pase de día ya
 * no sale de un plan del catálogo (migración 020). Queda en la fila con quién
 * lo vendió, así que el rastro de RNF-07 se conserva.
 */
export class CreateDayPassDto {
  @IsString()
  @MaxLength(150)
  // Al menos un carácter que no sea espacio: el nombre es lo único que dice
  // quién estuvo en el gimnasio ese día.
  @Matches(/\S/, { message: "El nombre del visitante es obligatorio." })
  visitorName!: string;

  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: 'amount debe ser un monto válido (ej. "6000.00")',
  })
  amount!: string;

  @IsIn(["cash", "transfer"])
  paymentMethod!: PaymentMethod;
}
