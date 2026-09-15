import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

/** Query string de `GET /finance/monthly-summary` (RF-32). */
export class MonthlySummaryQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  year!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month!: number;
}
