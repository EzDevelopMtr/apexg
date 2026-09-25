import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

/** Body de `POST /savings-pockets`. */
export class CreateSavingsPocketDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: 'goalAmount debe ser un monto válido (ej. "3000000.00")',
  })
  goalAmount!: string;
}
