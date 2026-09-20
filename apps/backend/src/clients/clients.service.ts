import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { DATABASE } from '../database/database.constants.js';
import type { Database } from '../database/database.types.js';
import { clients } from '../database/schema/schema.js';
import { assertDefined } from '../shared/assert-defined.util.js';

import { ClientMembershipService } from './client-membership.service.js';
import { ClientOverdueSyncService } from './client-overdue-sync.service.js';
import type { CreateClientDto } from './create-client.dto.js';
import type { UpdateClientDto } from './update-client.dto.js';
import type { ClientMembershipSummary, ClientResult, ClientState, ListClientsFilter } from './clients.types.js';
import { calculateEndDate, isDurationUnit, today } from './membership-date.util.js';

type ClientRow = typeof clients.$inferSelect;

@Injectable()
export class ClientsService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly memberships: ClientMembershipService,
    private readonly overdueSync: ClientOverdueSyncService,
  ) {}

  async create(
    companyId: string,
    userId: string,
    input: CreateClientDto,
  ): Promise<ClientResult> {
    const startDate = input.startDate ?? today();

    return this.db.transaction(async (tx) => {
      const plan = await this.memberships.loadActivePlan(tx, companyId, input.membershipTypeId);
      const trainerId = await this.memberships.resolveTrainer(tx, companyId, plan, input.trainerId);

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
        throw new ConflictException('Ya existe un cliente con ese documento.');
      }

      if (!isDurationUnit(plan.durationUnit)) {
        throw new BadRequestException(
          `El plan tiene una unidad de vigencia desconocida: ${plan.durationUnit}.`,
        );
      }
      const endDate = calculateEndDate(startDate, plan.durationValue, plan.durationUnit);

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
      const client = assertDefined(insertedClient, 'INSERT into clients did not return a row.');

      const membership = await this.memberships.create(tx, {
        companyId,
        clientId: client.id,
        userId,
        plan,
        trainerId,
        startDate,
        endDate,
      });

      return this.toResult(client, membership);
    });
  }

  async findAll(companyId: string, filter: ListClientsFilter): Promise<ClientResult[]> {
    await this.overdueSync.run(companyId);

    const conditions = [eq(clients.companyId, companyId)];
    if (filter.state !== undefined) {
      conditions.push(eq(clients.state, filter.state));
    }

    const rows = await this.db
      .select()
      .from(clients)
      .where(and(...conditions))
      .orderBy(clients.fullName);

    const memberships = await this.memberships.latestFor(rows.map((row) => row.id));
    let results = rows.map((row) => this.toResult(row, memberships.get(row.id) ?? null));

    if (filter.expiringWithinDays !== undefined) {
      const from = today();
      const to = calculateEndDate(from, filter.expiringWithinDays, 'day');
      results = results.filter(
        (client) =>
          client.state === 1 &&
          client.currentMembership !== null &&
          client.currentMembership.endDate >= from &&
          client.currentMembership.endDate <= to,
      );
    }

    return results;
  }

  async findOne(companyId: string, id: string): Promise<ClientResult> {
    await this.overdueSync.run(companyId);

    const row = await this.loadClient(companyId, id);
    const memberships = await this.memberships.latestFor([id]);
    return this.toResult(row, memberships.get(id) ?? null);
  }

  async update(
    companyId: string,
    id: string,
    input: UpdateClientDto,
  ): Promise<ClientResult> {
    await this.loadClient(companyId, id);

    const patch: Partial<typeof clients.$inferInsert> = {};
    if (input.fullName !== undefined) patch.fullName = input.fullName;
    if (input.phone !== undefined) patch.phone = input.phone;
    if (input.email !== undefined) patch.email = input.email;
    if (input.emergencyContactName !== undefined) {
      patch.emergencyContactName = input.emergencyContactName;
    }
    if (input.emergencyContactPhone !== undefined) {
      patch.emergencyContactPhone = input.emergencyContactPhone;
    }
    if (input.bloodType !== undefined) patch.bloodType = input.bloodType;
    if (input.medicalCondition !== undefined) {
      patch.medicalCondition = input.medicalCondition;
    }

    if (Object.keys(patch).length > 0) {
      await this.db
        .update(clients)
        .set({ ...patch, updatedAt: new Date().toISOString() })
        .where(eq(clients.id, id));
    }

    return this.findOne(companyId, id);
  }

  /** SRS §4.5: el cliente se retira sin necesidad de indicar un motivo. */
  async retire(companyId: string, id: string): Promise<ClientResult> {
    const existing = await this.loadClient(companyId, id);
    if (existing.state === 2) {
      throw new BadRequestException('El cliente ya está inactivo.');
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

  private async loadClient(companyId: string, id: string): Promise<ClientRow> {
    const [row] = await this.db
      .select()
      .from(clients)
      .where(and(eq(clients.id, id), eq(clients.companyId, companyId)));
    if (!row) {
      throw new NotFoundException('Cliente no encontrado.');
    }
    return row;
  }

  private toResult(
    row: ClientRow,
    membership: ClientMembershipSummary | null,
  ): ClientResult {
    return {
      id: row.id,
      documentNumber: row.documentNumber,
      fullName: row.fullName,
      phone: row.phone,
      email: row.email,
      emergencyContactName: row.emergencyContactName,
      emergencyContactPhone: row.emergencyContactPhone,
      bloodType: row.bloodType,
      birthDate: row.birthDate,
      medicalCondition: row.medicalCondition,
      state: row.state as ClientState,
      registeredAt: row.registeredAt,
      retiredAt: row.retiredAt,
      currentMembership: membership,
    };
  }
}
