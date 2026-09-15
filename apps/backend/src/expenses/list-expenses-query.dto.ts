import { IsDateString, IsOptional, IsUUID } from 'class-validator';

/** Query string de `GET /expenses`. */
export class ListExpensesQueryDto {
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
