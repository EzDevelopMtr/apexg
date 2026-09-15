import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq, and, inArray } from 'drizzle-orm';

import { DATABASE } from '../database/database.constants.js';
import type { Database, DatabaseTransaction } from '../database/database.types.js';
import { clientMemberships, membershipTypes, trainers } from '../database/schema/schema.js';
import { assertDefined } from '../shared/assert-defined.util.js';

import type { ClientMembershipSummary } from './clients.types.js';

/** Lo que `create()` necesita del plan ya validado por `loadActivePlan`. */
interface AgreedPlan {
  id: string;
  name: string;
  price: string;
}

interface CreateMembershipInput {
  companyId: string;
  clientId: string;
  userId: string;
  plan: AgreedPlan;
  trainerId: string | null;
  startDate: string;
  endDate: string;
}

interface MembershipRow {
  id: string;
  clientId: string;
  membershipTypeId: string;
  membershipTypeName: string;
  trainerId: string | null;
  startDate: string;
  endDate: string;
  agreedPrice: string;
}

/**
 * Resuelve el plan y el entrenador de una membresía nueva, y el snapshot de
 * la membresía vigente de un cliente para la respuesta HTTP — separado de
 * `ClientsService` porque es una responsabilidad sobre `client_memberships`/
 * `membership_types`/`trainers`, no sobre la identidad del cliente en sí.
 */
@Injectable()
export class ClientMembershipService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async loadActivePlan(tx: DatabaseTransaction, companyId: string, membershipTypeId: string) {
    const [plan] = await tx
      .select({
        id: membershipTypes.id,
        name: membershipTypes.name,
        price: membershipTypes.price,
        durationValue: membershipTypes.durationValue,
        durationUnit: membershipTypes.durationUnit,
        trainerShare: membershipTypes.trainerShare,
        state: membershipTypes.state,
      })
      .from(membershipTypes)
      .where(
        and(
          eq(membershipTypes.id, membershipTypeId),
          eq(membershipTypes.companyId, companyId),
        ),
      );

    if (!plan) {
      throw new NotFoundException('El tipo de membresía no existe.');
    }
    if (plan.state !== 1) {
      throw new BadRequestException('El tipo de membresía está inactivo.');
    }
    return plan;
  }

  /**
   * Un plan "requiere entrenador" cuando tiene `trainer_share` definido
   * (Personalizado / Semipersonalizado, ver schema.dbml) — no hay una
   * columna booleana aparte; se deriva del mismo dato que ya reparte el
   * pago, igual que en `@apexg/core` (`requiresTrainer`).
   */
  async resolveTrainer(
    tx: DatabaseTransaction,
    companyId: string,
    plan: { trainerShare: string | null },
    trainerId: string | undefined,
  ): Promise<string | null> {
    const requiresTrainer = plan.trainerShare !== null;

    if (requiresTrainer && !trainerId) {
      throw new BadRequestException('Este plan requiere seleccionar un entrenador.');
    }
    if (!requiresTrainer && trainerId) {
      throw new BadRequestException('Este plan no admite asignar un entrenador.');
    }
    if (!trainerId) {
      return null;
    }

    const [trainer] = await tx
      .select({ id: trainers.id, state: trainers.state })
      .from(trainers)
      .where(and(eq(trainers.id, trainerId), eq(trainers.companyId, companyId)));

    if (!trainer) {
      throw new NotFoundException('El entrenador no existe.');
    }
    if (trainer.state !== 1) {
      throw new BadRequestException('El entrenador está inactivo.');
    }
    return trainer.id;
  }

  /** Inserta la membresía inicial de un cliente nuevo, dentro de la transacción de `create()`. */
  async create(
    tx: DatabaseTransaction,
    input: CreateMembershipInput,
  ): Promise<ClientMembershipSummary> {
    const [insertedMembership] = await tx
      .insert(clientMemberships)
      .values({
        companyId: input.companyId,
        clientId: input.clientId,
        membershipTypeId: input.plan.id,
        trainerId: input.trainerId,
        startDate: input.startDate,
        endDate: input.endDate,
        agreedPrice: input.plan.price,
        createdBy: input.userId,
      })
      .returning();
    const membership = assertDefined(
      insertedMembership,
      'INSERT into client_memberships did not return a row.',
    );

    return {
      id: membership.id,
      membershipTypeId: input.plan.id,
      membershipTypeName: input.plan.name,
      trainerId: input.trainerId,
      startDate: input.startDate,
      endDate: input.endDate,
      agreedPrice: input.plan.price,
    };
  }

  /** La membresía más reciente (por fecha de inicio) de cada cliente pedido. */
  async latestFor(clientIds: readonly string[]): Promise<Map<string, ClientMembershipSummary>> {
    if (clientIds.length === 0) {
      return new Map();
    }

    const rows: MembershipRow[] = await this.db
      .select({
        id: clientMemberships.id,
        clientId: clientMemberships.clientId,
        membershipTypeId: clientMemberships.membershipTypeId,
        membershipTypeName: membershipTypes.name,
        trainerId: clientMemberships.trainerId,
        startDate: clientMemberships.startDate,
        endDate: clientMemberships.endDate,
        agreedPrice: clientMemberships.agreedPrice,
      })
      .from(clientMemberships)
      .innerJoin(membershipTypes, eq(membershipTypes.id, clientMemberships.membershipTypeId))
      .where(inArray(clientMemberships.clientId, [...clientIds]));

    const latestByClient = new Map<string, MembershipRow>();
    for (const row of rows) {
      const current = latestByClient.get(row.clientId);
      if (!current || row.startDate > current.startDate) {
        latestByClient.set(row.clientId, row);
      }
    }

    const summaries = new Map<string, ClientMembershipSummary>();
    for (const [clientId, row] of latestByClient) {
      summaries.set(clientId, {
        id: row.id,
        membershipTypeId: row.membershipTypeId,
        membershipTypeName: row.membershipTypeName,
        trainerId: row.trainerId,
        startDate: row.startDate,
        endDate: row.endDate,
        agreedPrice: row.agreedPrice,
      });
    }
    return summaries;
  }
}
