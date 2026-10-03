import { IsIn, IsOptional, IsString, Matches, MaxLength, MinLength, ValidateIf } from 'class-validator';

import type { CompanyStatus } from '../companies/companies.types.js';

/** Alta de un gimnasio con su primer administrador. */
export class CreatePlatformCompanyDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  /** Formato completo (y rutas reservadas) los revisa `isCompanySlug`. */
  @IsString()
  slug!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(50)
  adminUsername!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(150)
  adminFullName!: string;

  @IsOptional()
  @Matches(/^#[0-9a-f]{6}$/)
  brandColor?: string;
}

export class UpdatePlatformCompanyDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsIn(['active', 'suspended'])
  status?: CompanyStatus;

  /** `null` vuelve a los colores por defecto. */
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  brandColor?: string | null;
}

export class PlatformLoginDto {
  @IsString()
  @MaxLength(254)
  email!: string;

  @IsString()
  @MaxLength(128)
  password!: string;
}
