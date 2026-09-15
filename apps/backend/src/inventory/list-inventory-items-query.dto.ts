import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional } from 'class-validator';

/** Query string de `GET /inventory-items`. */
export class ListInventoryItemsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([1, 2])
  state?: number;

  /** RF-30 [PROPUESTA]: `?belowMinimum=true` filtra a existencia <= mínimo. */
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (value === undefined ? undefined : value === 'true'))
  @IsBoolean()
  belowMinimum?: boolean;
}
