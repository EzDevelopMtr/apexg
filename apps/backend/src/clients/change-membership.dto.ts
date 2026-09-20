import { IsISO8601, IsOptional, IsUUID } from "class-validator";

/**
 * Body de `POST /clients/:id/memberships`.
 *
 * Renovar el mismo plan y cambiarlo por otro son la misma operación: en los
 * dos casos empieza un periodo nuevo, con su fecha y su precio acordado. Lo
 * que NO existe es editar la membresía vigente — los pagos cuelgan de ella, y
 * moverle el plan o las fechas reescribiría contra qué se pagó (RNF-07).
 */
export class ChangeMembershipDto {
  @IsUUID()
  membershipTypeId!: string;

  /** Por defecto hoy. */
  @IsOptional()
  @IsISO8601()
  startDate?: string;

  /** Solo lo admiten los planes con reparto; se valida al resolverlo. */
  @IsOptional()
  @IsUUID()
  trainerId?: string;
}
