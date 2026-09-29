import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { DATABASE } from '../database/database.constants.js';
import type { Database } from '../database/database.types.js';
import {
  clientMemberships,
  clients,
  trainerCommissions,
  trainers,
} from '../database/schema/schema.js';

import type { CommissionRecord } from './trainers.types.js';

/**
 * RF-23: comisiones de un entrenador, con el cliente que las originó como
 * evidencia. Separado de `TrainersService` porque reportar comisiones no
 * es la misma responsabilidad que administrar el catálogo de entrenadores.
 * Pagarlas vive en `TrainerSettlementService`.
 */
@Injectable()
export class TrainerCommissionService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async listFor(companyId: string, trainerId: string): Promise<CommissionRecord[]> {
    const [trainer] = await this.db
      .select({ id: trainers.id })
      .from(trainers)
      .where(and(eq(trainers.id, trainerId), eq(trainers.companyId, companyId)));
    if (!trainer) {
      throw new NotFoundException('El entrenador no existe.');
    }

    return this.db
      .select({
        id: trainerCommissions.id,
        clientMembershipId: trainerCommissions.clientMembershipId,
        clientId: clients.id,
        clientFullName: clients.fullName,
        paymentId: trainerCommissions.paymentId,
        trainerAmount: trainerCommissions.trainerAmount,
        businessAmount: trainerCommissions.businessAmount,
        commissionDate: trainerCommissions.commissionDate,
        settled: trainerCommissions.settled,
        settledAt: trainerCommissions.settledAt,
        settlementMethod: trainerCommissions.settlementMethod,
        settlementReceiptPath: trainerCommissions.settlementReceiptPath,
      })
      .from(trainerCommissions)
      .innerJoin(clientMemberships, eq(clientMemberships.id, trainerCommissions.clientMembershipId))
      .innerJoin(clients, eq(clients.id, clientMemberships.clientId))
      .where(
        and(
          eq(trainerCommissions.companyId, companyId),
          eq(trainerCommissions.trainerId, trainerId),
        ),
      )
      .orderBy(trainerCommissions.commissionDate);
  }
}
