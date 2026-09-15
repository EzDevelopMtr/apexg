import { IsOptional, IsString, MaxLength } from 'class-validator';

/** Body de `POST /expense-categories` (RF-27). */
export class CreateExpenseCategoryDto {
  @IsString()
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;
}
