import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional } from 'class-validator';

/** Query string de `GET /membership-types`. */
export class ListMembershipTypesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([1, 2])
  state?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isPromotional?: boolean;
}
