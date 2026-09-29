import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';

import { DATABASE } from '../database/database.constants.js';
import type { Database } from '../database/database.types.js';
import { trainerCommissions } from '../database/schema/schema.js';

import type { SettleCommissionsDto } from './settle-commissions.dto.js';

/**
 * RF-23: pagarle a un entrenador lo que se le debe. Separado de
 * `TrainerCommissionService` porque mover plata no es lo mismo que reportarla.
 */
@Injectable()
export class TrainerSettlementService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  /**
   * Liquida varias comisiones en un solo pago, todo o nada. No se deshace
   * (RNF-07). Todas comparten método y comprobante: al entrenador se le
   * entrega lo acumulado de una vez, con una sola transferencia.
   */
  async settle(
    companyId: string,
    trainerId: string,
    input: SettleCommissionsDto,
    receiptPath: string | null,
  ): Promise<void> {
    await this.db.transaction(async (tx) => {
      const scope = and(
        inArray(trainerCommissions.id, input.commissionIds),
        eq(trainerCommissions.trainerId, trainerId),
        eq(trainerCommissions.companyId, companyId),
      );
      // FOR UPDATE: dos recepcionistas pagando a la vez no liquidan dos veces.
      const found = await tx
        .select({
          id: trainerCommissions.id,
          settled: trainerCommissions.settled,
        })
        .from(trainerCommissions)
        .where(scope)
        .for('update');
      if (found.length !== input.commissionIds.length) {
        throw new NotFoundException('La comisión no existe.');
      }
      if (found.some((commission) => commission.settled)) {
        throw new ConflictException('Esta comisión ya está liquidada.');
      }
      await tx
        .update(trainerCommissions)
        .set({
          settled: true,
          settledAt: new Date().toISOString(),
          settlementMethod: input.paymentMethod,
          settlementReceiptPath: receiptPath,
        })
        .where(scope);
    });
  }

  /** El comprobante con que se pagó una comisión ("" si no tiene). */
  async receiptOf(companyId: string, trainerId: string, commissionId: string): Promise<string> {
    const [row] = await this.db
      .select({ path: trainerCommissions.settlementReceiptPath })
      .from(trainerCommissions)
      .where(
        and(
          eq(trainerCommissions.id, commissionId),
          eq(trainerCommissions.trainerId, trainerId),
          eq(trainerCommissions.companyId, companyId),
        ),
      );
    if (!row) {
      throw new NotFoundException('La comisión no existe.');
    }
    return row.path ?? '';
  }
}
