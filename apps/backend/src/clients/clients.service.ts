import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
} from "@nestjs/common";
import { and, eq } from "drizzle-orm";

import { DATABASE } from "../database/database.constants.js";
import type { Database } from "../database/database.types.js";
import { clients } from "../database/schema/schema.js";
import { assertDefined } from "../shared/assert-defined.util.js";
import { ClientRenewalService } from "./client-renewal.service.js";
import { ClientsQueryService } from "./clients-query.service.js";
import { toClientPatch, toClientResult } from "./client-result.mapper.js";

import { ClientMembershipService } from "./client-membership.service.js";
import type { CreateClientDto } from "./create-client.dto.js";
import type { ChangeMembershipDto } from "./change-membership.dto.js";
import type { UpdateClientDto } from "./update-client.dto.js";
import type { ClientResult, ListClientsFilter } from "./clients.types.js";
import {
  calculateEndDate,
  isDurationUnit,
  today,
} from "./membership-date.util.js";

@Injectable()
export class ClientsService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly memberships: ClientMembershipService,
    private readonly renewals: ClientRenewalService,
    private readonly queries: ClientsQueryService,
  ) {}

  async create(
    companyId: string,
    userId: string,
    input: CreateClientDto,
  ): Promise<ClientResult> {
    const startDate = input.startDate ?? today();

    return this.db.transaction(async (tx) => {
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

      const [clash] = await tx
        .select({ id: clients.id })
        .from(clients)
        .where(
          and(
            eq(clients.companyId, companyId),
            eq(clients.documentNumber, input.documentNumber),
          ),
        );
      if (clash) {
        throw new ConflictException("Ya existe un cliente con ese documento.");
      }

      if (!isDurationUnit(plan.durationUnit)) {
        throw new BadRequestException(
          `El plan tiene una unidad de vigencia desconocida: ${plan.durationUnit}.`,
        );
      }
      const endDate = calculateEndDate(
        startDate,
        plan.durationValue,
        plan.durationUnit,
      );

      const [insertedClient] = await tx
        .insert(clients)
        .values({
          companyId,
          documentNumber: input.documentNumber,
          fullName: input.fullName,
          phone: input.phone ?? null,
          email: input.email ?? null,
          emergencyContactName: input.emergencyContactName ?? null,
          emergencyContactPhone: input.emergencyContactPhone ?? null,
          bloodType: input.bloodType ?? null,
          birthDate: input.birthDate ?? null,
          medicalCondition: input.medicalCondition ?? null,
          registeredAt: startDate,
          createdBy: userId,
        })
        .returning();
      const client = assertDefined(
        insertedClient,
        "INSERT into clients did not return a row.",
      );

      const membership = await this.memberships.create(tx, {
        companyId,
        clientId: client.id,
        userId,
        plan,
        trainerId,
        startDate,
        endDate,
      });

      return toClientResult(client, membership);
    });
  }

  findAll(
    companyId: string,
    filter: ListClientsFilter,
  ): Promise<ClientResult[]> {
    return this.queries.findAll(companyId, filter);
  }

  findOne(companyId: string, id: string): Promise<ClientResult> {
    return this.queries.findOne(companyId, id);
  }

  async update(
    companyId: string,
    id: string,
    input: UpdateClientDto,
  ): Promise<ClientResult> {
    await this.queries.load(companyId, id);

    const patch = toClientPatch(input);

    if (Object.keys(patch).length > 0) {
      await this.db
        .update(clients)
        .set({ ...patch, updatedAt: new Date().toISOString() })
        .where(eq(clients.id, id));
    }

    return this.findOne(companyId, id);
  }

  /**
   * Cierra la membresía vigente y abre una nueva (renovar o cambiar de plan).
   *
   * No edita la que ya existe: los pagos cuelgan de ella por
   * `client_membership_id`, y moverle el plan o las fechas reescribiría contra
   * qué se pagó (RNF-07). Cerrar y abrir deja cada pago atado a lo que el
   * cliente compró en su momento, y el historial intacto.
   *
   * Devuelve al cliente al estado "al día": si estaba en mora, empezar un
   * periodo nuevo es justamente lo que lo saca de ahí.
   */
  async changeMembership(
    companyId: string,
    userId: string,
    clientId: string,
    input: ChangeMembershipDto,
  ): Promise<ClientResult> {
    await this.queries.load(companyId, clientId);
    await this.renewals.run(companyId, userId, clientId, input);
    return this.findOne(companyId, clientId);
  }

  /** SRS §4.5: el cliente se retira sin necesidad de indicar un motivo. */
  async retire(companyId: string, id: string): Promise<ClientResult> {
    const existing = await this.queries.load(companyId, id);
    if (existing.state === 2) {
      throw new BadRequestException("El cliente ya está inactivo.");
    }

    await this.db
      .update(clients)
      .set({
        state: 2,
        retiredAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(clients.id, id));

    return this.findOne(companyId, id);
  }
}
