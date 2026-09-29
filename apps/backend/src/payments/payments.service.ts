import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { DATABASE } from '../database/database.constants.js';
import type { Database, DatabaseTransaction } from '../database/database.types.js';
import { clientMemberships, membershipTypes, payments } from '../database/schema/schema.js';
import { assertDefined } from '../shared/assert-defined.util.js';
import {
  classifyPaymentType,
  toPaymentResult,
} from './payment-result.mapper.js';
import {
  AuthorLookupService,
  authorName,
} from '../shared/author-lookup.service.js';
import { fromCents, toCents } from '../shared/money-amount.util.js';

import { checkAmount } from './payment-amount.rule.js';
import { PaymentCommissionService } from './payment-commission.service.js';
import type { CreatePaymentDto } from './create-payment.dto.js';
import type {
  ListPaymentsFilter,
  PaymentResult,
} from './payments.types.js';

@Injectable()
export class PaymentsService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly commissions: PaymentCommissionService,
    private readonly authors: AuthorLookupService,
  ) {}

  async create(
    companyId: string,
    userId: string,
    input: CreatePaymentDto,
    receiptPath: string | null = null,
  ): Promise<PaymentResult> {
    return this.db.transaction(async (tx) => {
      const membership = await this.loadMembership(tx, companyId, input.clientMembershipId);
      const plan = await this.loadPlan(tx, membership.membershipTypeId);

      const priorPayments = await tx
        .select({ amount: payments.amount })
        .from(payments)
        .where(eq(payments.clientMembershipId, membership.id));

      const paidCents = priorPayments.reduce(
        (sum, row) => sum + toCents(row.amount),
        0,
      );
      const agreedCents = toCents(membership.agreedPrice);
      const balanceBeforeCents = agreedCents - paidCents;

      const amountCents = toCents(input.amount);
      checkAmount(amountCents, balanceBeforeCents, plan);

      const balanceAfterCents = balanceBeforeCents - amountCents;
      const paymentType = classifyPaymentType(
        priorPayments.length,
        balanceAfterCents <= 0,
      );
      const paidAt = input.paidAt ?? new Date().toISOString();

      const [insertedPayment] = await tx
        .insert(payments)
        .values({
          companyId,
          clientMembershipId: membership.id,
          amount: input.amount,
          paymentType,
          paymentMethod: input.paymentMethod,
          balanceAfter: fromCents(Math.max(balanceAfterCents, 0)),
          paidAt,
          notes: input.notes ?? null,
          createdBy: userId,
          installmentNumber: priorPayments.length + 1,
          receiptPath,
        })
        .returning();
      const payment = assertDefined(insertedPayment, 'INSERT into payments did not return a row.');

      const commission = await this.commissions.maybeRegister(tx, {
        companyId,
        membership,
        plan,
        payment,
        amountCents,
        paidAt,
      });

      return toPaymentResult(
        payment,
        {
          clientId: membership.clientId,
          membershipTypeId: membership.membershipTypeId,
          agreedPrice: membership.agreedPrice,
          startDate: membership.startDate,
        },
        commission,
        await this.authors.nameOf(userId),
      );
    });
  }

  async findAll(companyId: string, filter: ListPaymentsFilter): Promise<PaymentResult[]> {
    const conditions = [eq(payments.companyId, companyId)];
    if (filter.clientMembershipId !== undefined) {
      conditions.push(eq(payments.clientMembershipId, filter.clientMembershipId));
    }

    const rows = await this.withMembership()
      .where(and(...conditions))
      .orderBy(payments.paidAt);

    const ids = rows.map((row) => row.payment.id);
    const commissions = await this.commissions.byPaymentId(companyId, ids);
    const authors = await this.authors.namesOf(rows.map((row) => row.payment.createdBy));
    return rows.map(({ payment, membership }) =>
      toPaymentResult(
        payment,
        membership,
        commissions.get(payment.id) ?? null,
        authorName(authors, payment.createdBy),
      ),
    );
  }

  async findOne(companyId: string, id: string): Promise<PaymentResult> {
    const [row] = await this.withMembership().where(
      and(eq(payments.id, id), eq(payments.companyId, companyId)),
    );
    if (!row) {
      throw new NotFoundException('El pago no existe.');
    }

    const commissions = await this.commissions.byPaymentId(companyId, [id]);
    return toPaymentResult(
      row.payment,
      row.membership,
      commissions.get(id) ?? null,
      await this.authors.nameOf(row.payment.createdBy),
    );
  }

  /**
   * Cada pago junto a la membresía a la que pertenece, vigente o no: tras una
   * renovación, los pagos del ciclo anterior siguen siendo de ese cliente y
   * ese plan.
   */
  private withMembership() {
    return this.db
      .select({
        payment: payments,
        membership: {
          clientId: clientMemberships.clientId,
          membershipTypeId: clientMemberships.membershipTypeId,
          agreedPrice: clientMemberships.agreedPrice,
          startDate: clientMemberships.startDate,
        },
      })
      .from(payments)
      .innerJoin(clientMemberships, eq(clientMemberships.id, payments.clientMembershipId));
  }

  private async loadMembership(
    tx: DatabaseTransaction,
    companyId: string,
    id: string,
  ) {
    const [membership] = await tx
      .select({
        id: clientMemberships.id,
        clientId: clientMemberships.clientId,
        startDate: clientMemberships.startDate,
        membershipTypeId: clientMemberships.membershipTypeId,
        trainerId: clientMemberships.trainerId,
        agreedPrice: clientMemberships.agreedPrice,
      })
      .from(clientMemberships)
      .where(
        and(
          eq(clientMemberships.id, id),
          eq(clientMemberships.companyId, companyId),
        ),
      );
    if (!membership) {
      throw new NotFoundException('La membresía no existe.');
    }
    return membership;
  }

  private async loadPlan(tx: DatabaseTransaction, membershipTypeId: string) {
    const [plan] = await tx
      .select({
        price: membershipTypes.price,
        minimumPayment: membershipTypes.minimumPayment,
        allowsPartialPayment: membershipTypes.allowsPartialPayment,
        trainerShare: membershipTypes.trainerShare,
        businessShare: membershipTypes.businessShare,
      })
      .from(membershipTypes)
      .where(eq(membershipTypes.id, membershipTypeId));
    if (!plan) {
      // La FK de client_memberships garantiza que el plan existe; esto
      // solo protegería contra una corrupción de datos, no un caso de uso real.
      throw new NotFoundException('El tipo de membresía de esta membresía no existe.');
    }
    return plan;
  }

  /**
   * Clasifica el pago en los 4 valores que admite `payments.payment_type`
   * (categoría gruesa: full/first/second/final). El número EXACTO de
   * abono (relevante cuando `membership_types.minimum_payment` se baja lo
   * suficiente para permitir 3+ abonos intermedios, RF-12) vive aparte en
   * `installment_number` — ver `create()`.
   */
}
