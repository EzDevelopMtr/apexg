import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { and, eq } from "drizzle-orm";

import type { DatabaseTransaction } from "../database/database.types.js";
import {
  clientMemberships,
  membershipTypes,
  trainers,
} from "../database/schema/schema.js";
import { assertDefined } from "../shared/assert-defined.util.js";

import type { ClientMembershipSummary } from "./clients.types.js";

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

/**
 * Resuelve el plan y el entrenador de una membresía nueva, la abre, cierra la
 * anterior, y arma el snapshot de la vigente para la respuesta HTTP.
 *
 * Separado de `ClientsService` porque es una responsabilidad sobre
 * `client_memberships`, `membership_types` y `trainers`, no sobre la
 * identidad del cliente en sí.
 *
 * Sin `db` propio: cada método recibe la transacción de quien lo llama, para
 * que abrir una membresía y escribir el cliente sean atómicos.
 */
@Injectable()
export class ClientMembershipService {
  async loadActivePlan(
    tx: DatabaseTransaction,
    companyId: string,
    membershipTypeId: string,
  ) {
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
      throw new NotFoundException("El tipo de membresía no existe.");
    }
    if (plan.state !== 1) {
      throw new BadRequestException("El tipo de membresía está inactivo.");
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
      throw new BadRequestException(
        "Este plan requiere seleccionar un entrenador.",
      );
    }
    if (!requiresTrainer && trainerId) {
      throw new BadRequestException(
        "Este plan no admite asignar un entrenador.",
      );
    }
    if (!trainerId) {
      return null;
    }

    const [trainer] = await tx
      .select({ id: trainers.id, state: trainers.state })
      .from(trainers)
      .where(
        and(eq(trainers.id, trainerId), eq(trainers.companyId, companyId)),
      );

    if (!trainer) {
      throw new NotFoundException("El entrenador no existe.");
    }
    if (trainer.state !== 1) {
      throw new BadRequestException("El entrenador está inactivo.");
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
      "INSERT into client_memberships did not return a row.",
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

  /**
   * Cierra la vigente marcándola inactiva, sin borrarla.
   *
   * Los pagos apuntan a ella y el historial tiene que seguir siendo legible:
   * borrar la fila dejaría pagos colgando de una membresía inexistente.
   */
  async closeCurrent(
    tx: DatabaseTransaction,
    companyId: string,
    clientId: string,
  ): Promise<void> {
    await tx
      .update(clientMemberships)
      .set({ state: 2, updatedAt: new Date().toISOString() })
      .where(
        and(
          eq(clientMemberships.companyId, companyId),
          eq(clientMemberships.clientId, clientId),
          eq(clientMemberships.state, 1),
        ),
      );
  }
}
