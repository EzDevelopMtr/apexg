import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

/** Body de `POST /daily-log`. `date` por defecto es hoy si se omite. */
export class CreateDailyLogDto {
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  observations?: string;
}
