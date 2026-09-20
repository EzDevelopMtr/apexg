import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";

import { DATABASE } from "../database/database.constants.js";
import type { Database } from "../database/database.types.js";
import { clients } from "../database/schema/schema.js";

import type { ChangeMembershipDto } from "./change-membership.dto.js";
import { ClientMembershipService } from "./client-membership.service.js";
import {
  calculateEndDate,
  isDurationUnit,
  today,
} from "./membership-date.util.js";

/**
 * Renovar la membresía o cambiarla por otra.
 *
 * Nunca edita la vigente: los pagos cuelgan de ella por
 * `client_membership_id`, y moverle el plan o las fechas reescribiría contra
 * qué se pagó (RNF-07). Cierra la anterior y abre una nueva, de modo que cada
 * pago queda atado a lo que el cliente compró en su momento.
 */
@Injectable()
export class ClientRenewalService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly memberships: ClientMembershipService,
  ) {}

  async run(
    companyId: string,
    userId: string,
    clientId: string,
    input: ChangeMembershipDto,
  ): Promise<void> {
    const startDate = input.startDate ?? today();

    await this.db.transaction(async (tx) => {
      const plan = await this.memberships.loadActivePlan(
        tx,
        companyId,
        input.membershipTypeId,
      );
      const trainerId = await this.memberships.resolveTrainer(
        tx,
        companyId,
        plan,
        input.trainerId,
      );

      if (!isDurationUnit(plan.durationUnit)) {
        throw new BadRequestException(
          `El plan tiene una unidad de vigencia desconocida: ${plan.durationUnit}.`,
        );
      }

      await this.memberships.closeCurrent(tx, companyId, clientId);
      await this.memberships.create(tx, {
        companyId,
        clientId,
        userId,
        plan,
        trainerId,
        startDate,
        endDate: calculateEndDate(
          startDate,
          plan.durationValue,
          plan.durationUnit,
        ),
      });

      // Vuelve a "al día": si estaba en mora, empezar un periodo nuevo es
      // justamente lo que lo saca de ahí.
      await tx
        .update(clients)
        .set({ state: 1, updatedAt: new Date().toISOString() })
        .where(eq(clients.id, clientId));
    });
  }
}
