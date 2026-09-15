import { Inject, Injectable } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';

import { DATABASE } from '../database/database.constants.js';
import type { Database, DatabaseTransaction } from '../database/database.types.js';
import { payments, trainerCommissions } from '../database/schema/schema.js';
import { toLocalDate } from '../shared/date.util.js';
import { fromCents, toCents } from '../shared/money-amount.util.js';

import type { CommissionSummary } from './payments.types.js';

type PaymentRow = typeof payments.$inferSelect;

/** Lo que se necesita para decidir y registrar el reparto de un pago. */
export interface CommissionContext {
  companyId: string;
  membership: { id: string; trainerId: string | null };
  plan: { price: string; trainerShare: string | null; businessShare: string | null };
  payment: PaymentRow;
  amountCents: number;
  paidAt: string;
}

/**
 * RF-16, RF-23, SRS §4.4. Su propia clase porque el reparto entrenador/
 * negocio es una responsabilidad separada de registrar el pago en sí —
 * `PaymentsService.create` no necesita saber CÓMO se calcula una
 * comisión, solo que puede haber una.
 */
@Injectable()
export class PaymentCommissionService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  /**
   * Cada pago a una membresía con entrenador genera SU PROPIA comisión,
   * proporcional a ese pago — no una comisión única por membresía. Lo
   * confirma el esquema: `trainer_commissions.payment_id` es `NOT NULL
   * UNIQUE` (cada pago genera como máximo una comisión).
   *
   * El reparto se calcula por proporción exacta en centavos: se redondea
   * la parte del entrenador y la del negocio se obtiene por resta, nunca
   * redondeando las dos por separado (evita que la suma no cuadre con el
   * monto pagado).
   */
  async maybeRegister(
    tx: DatabaseTransaction,
    context: CommissionContext,
  ): Promise<CommissionSummary | null> {
    const { companyId, membership, plan, payment, amountCents, paidAt } = context;
    if (plan.trainerShare === null || plan.businessShare === null || !membership.trainerId) {
      return null;
    }

    const priceCents = toCents(plan.price);
    const trainerShareCents = toCents(plan.trainerShare);
    const trainerAmountCents = Math.round((amountCents * trainerShareCents) / priceCents);
    const businessAmountCents = amountCents - trainerAmountCents;

    await tx.insert(trainerCommissions).values({
      companyId,
      trainerId: membership.trainerId,
      clientMembershipId: membership.id,
      paymentId: payment.id,
      trainerAmount: fromCents(trainerAmountCents),
      businessAmount: fromCents(businessAmountCents),
      // RF-23: fecha LOCAL de la comisión, no la fecha UTC de `paidAt`
      // (mismo bug que ya se corrigió en `today()` — ver shared/date.util.ts).
      commissionDate: toLocalDate(paidAt),
    });

    return {
      trainerId: membership.trainerId,
      trainerAmount: fromCents(trainerAmountCents),
      businessAmount: fromCents(businessAmountCents),
    };
  }

  async byPaymentId(
    companyId: string,
    paymentIds: readonly string[],
  ): Promise<Map<string, CommissionSummary>> {
    if (paymentIds.length === 0) {
      return new Map();
    }

    const rows = await this.db
      .select({
        paymentId: trainerCommissions.paymentId,
        trainerId: trainerCommissions.trainerId,
        trainerAmount: trainerCommissions.trainerAmount,
        businessAmount: trainerCommissions.businessAmount,
      })
      .from(trainerCommissions)
      .where(
        and(
          eq(trainerCommissions.companyId, companyId),
          inArray(trainerCommissions.paymentId, [...paymentIds]),
        ),
      );

    const result = new Map<string, CommissionSummary>();
    for (const row of rows) {
      result.set(row.paymentId, {
        trainerId: row.trainerId,
        trainerAmount: row.trainerAmount,
        businessAmount: row.businessAmount,
      });
    }
    return result;
  }
}
