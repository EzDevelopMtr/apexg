import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

/** Body de `PATCH /inventory-categories/:id`. */
export class UpdateInventoryCategoryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsIn([1, 2])
  state?: 1 | 2;
}
