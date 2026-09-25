import { IsDateString, IsOptional, IsUUID } from 'class-validator';

/** Query string de `GET /savings-contributions`. */
export class ListContributionsQueryDto {
  @IsOptional()
  @IsUUID()
  pocketId?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
