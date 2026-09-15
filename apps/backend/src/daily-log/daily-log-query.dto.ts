import { IsDateString, IsOptional } from 'class-validator';

/** Query string de `GET /daily-log`. Por defecto hoy si se omite `date`. */
export class DailyLogQueryDto {
  @IsOptional()
  @IsDateString()
  date?: string;
}
