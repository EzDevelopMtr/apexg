import { IsEmail, IsOptional, IsString, MaxLength } from "class-validator";

/**
 * Body de `PATCH /clients/:id` (RF-05).
 *
 * Solo datos personales. `state` no se edita aquí: retirar un cliente es
 * una acción propia (`POST /clients/:id/retire`, SRS §4.5) para que un
 * PATCH genérico no pueda escribir `state = 3` (en mora), que el sistema
 * deriva, no que el usuario elige.
 */
export class UpdateClientDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  fullName?: string;

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
  @IsString()
  medicalCondition?: string;
}
