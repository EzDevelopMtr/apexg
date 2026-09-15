import { IsOptional, IsUUID } from 'class-validator';

/** Query string de `GET /payments`. */
export class ListPaymentsQueryDto {
  @IsOptional()
  @IsUUID()
  clientMembershipId?: string;
}
