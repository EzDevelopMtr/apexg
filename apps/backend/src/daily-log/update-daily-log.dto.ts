import { IsString, MaxLength } from 'class-validator';

/** Body de `PATCH /daily-log/:date`. Único campo editable: `observations`. */
export class UpdateDailyLogDto {
  @IsString()
  @MaxLength(4000)
  observations!: string;
}
