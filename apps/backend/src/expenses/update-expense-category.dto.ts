import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

/** Body de `PATCH /expense-categories/:id` (RF-27, "ampliar o eliminar"). */
export class UpdateExpenseCategoryDto {
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
