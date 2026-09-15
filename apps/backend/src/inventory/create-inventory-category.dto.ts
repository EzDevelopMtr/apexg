import { IsOptional, IsString, MaxLength } from 'class-validator';

/** Body de `POST /inventory-categories`. */
export class CreateInventoryCategoryDto {
  @IsString()
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;
}
