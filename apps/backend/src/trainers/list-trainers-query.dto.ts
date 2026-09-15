import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional } from 'class-validator';

/** Query string de `GET /trainers`. */
export class ListTrainersQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([1, 2])
  state?: number;
}
