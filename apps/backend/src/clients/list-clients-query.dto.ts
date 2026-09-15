import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Min } from 'class-validator';

/** Query string de `GET /clients`. Los query params llegan como string. */
export class ListClientsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([1, 2, 3])
  state?: number;

  /** Solo clientes activos cuya membresía vence dentro de N días. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  expiringWithinDays?: number;
}
