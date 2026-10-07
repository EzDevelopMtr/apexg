import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

/** Un usuario de un gimnasio, visto desde el panel. Nunca lleva la contraseña. */
export interface PlatformUserRow {
  id: string;
  username: string;
  fullName: string;
  roleId: number;
  roleName: string;
  active: boolean;
  createdAt: string;
}

/** Un perfil del gimnasio (tabla roles). Un perfil nuevo es una fila más. */
export interface PlatformRoleRow {
  id: number;
  name: string;
}

/** El formato fino del usuario lo revisa `usernameProblem`. */
export class CreatePlatformUserDto {
  @IsString()
  @MaxLength(50)
  username!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(150)
  fullName!: string;

  @IsInt()
  @Min(1)
  roleId!: number;
}

export class UpdatePlatformUserDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  roleId?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
