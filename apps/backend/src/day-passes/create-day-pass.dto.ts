import { IsIn, IsOptional, IsString, Matches, MaxLength } from "class-validator";

import type { PaymentMethod } from "../payments/payments.types.js";

/**
 * Body de `POST /day-passes`.
 *
 * Sin `amount`: el precio lo pone el servidor desde el plan de un día del
 * catálogo. Si lo mandara el formulario, cualquiera podría vender un día a
 * otro precio sin que quedara rastro de por qué.
 */
export class CreateDayPassDto {
  @IsString()
  @MaxLength(150)
  // Al menos un carácter que no sea espacio: el nombre es lo único que dice
  // quién estuvo en el gimnasio ese día.
  @Matches(/\S/, { message: "El nombre del visitante es obligatorio." })
  visitorName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  visitorContact?: string;

  @IsIn(["cash", "transfer"])
  paymentMethod!: PaymentMethod;
}
