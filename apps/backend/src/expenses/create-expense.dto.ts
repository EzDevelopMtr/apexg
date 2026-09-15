import { IsDateString, IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';

/** Body de `POST /expenses` (RF-26). */
export class CreateExpenseDto {
  @IsUUID()
  categoryId!: string;

  @IsString()
  @MaxLength(200)
  concept!: string;

  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: 'amount debe ser un monto válido (ej. "420000.00")',
  })
  amount!: string;

  /** Por defecto hoy si se omite. */
  @IsOptional()
  @IsDateString()
  expenseDate?: string;
}
