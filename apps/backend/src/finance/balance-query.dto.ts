import { IsDateString } from 'class-validator';

/** Query string de `GET /finance/balance` (RF-31): rango arbitrario —
 *  el cliente elige la granularidad (día, semana, mes) con `from`/`to`. */
export class BalanceQueryDto {
  @IsDateString()
  from!: string;

  @IsDateString()
  to!: string;
}
