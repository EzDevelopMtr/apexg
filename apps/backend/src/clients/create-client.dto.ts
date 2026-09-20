import {
  IsDateString,
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from "class-validator";

/**
 * Body de `POST /clients` (RF-04).
 *
 * Registrar un cliente incluye su primera membresía: el modelo de datos
 * separa `clients` (identidad) de `client_memberships` (la membresía en
 * sí), así que el alta siempre toca ambas tablas en una transacción.
 *
 * `trainerId` solo es válido cuando el plan elegido lo requiere
 * (`membership_types.trainer_share IS NOT NULL`) — el servicio lo valida,
 * no este DTO, porque depende de datos de la base.
 */
export class CreateClientDto {
  @IsString()
  @MaxLength(50)
  documentNumber!: string;

  @IsString()
  @MaxLength(150)
  fullName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  emergencyContactName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  emergencyContactPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5)
  bloodType?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @IsString()
  medicalCondition?: string;

  @IsUUID()
  membershipTypeId!: string;

  /** RF-06: por defecto hoy, editable cuando la membresía inicia otro día. */
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsUUID()
  trainerId?: string;
}
