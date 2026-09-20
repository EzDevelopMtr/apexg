import { IsUUID } from "class-validator";

/**
 * Body de `POST /attendances`.
 *
 * Solo el cliente: la hora la pone el servidor. Dejar que el navegador mande
 * el instante permitiría registrar ingresos en cualquier momento, y la
 * asistencia es el dato con el que se cobra el cupo.
 */
export class CreateAttendanceDto {
  @IsUUID()
  clientId!: string;
}
