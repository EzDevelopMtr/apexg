import { IsDateString, IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';

/** Body de `PATCH /expenses/:id`. `egresos.update` existe en el catálogo de
 *  permisos, así que a diferencia de Pagos aquí sí se admite edición. */
export class UpdateExpenseDto {
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  concept?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: 'amount debe ser un monto válido (ej. "420000.00")',
  })
  amount?: string;

  @IsOptional()
  @IsDateString()
  expenseDate?: string;
}
