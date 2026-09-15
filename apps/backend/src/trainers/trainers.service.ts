import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, inArray, sql } from 'drizzle-orm';

// Value import: constructor-injected (see the note in access-token.guard.ts).
import { AuthorizationService } from '../auth/authorization.service.js';
import { DATABASE } from '../database/database.constants.js';
import type { Database } from '../database/database.types.js';
import { clientMemberships, trainers } from '../database/schema/schema.js';
import { assertDefined } from '../shared/assert-defined.util.js';
import {
  PG_FOREIGN_KEY_VIOLATION,
  PG_UNIQUE_VIOLATION,
  pgErrorCode,
} from '../shared/pg-error.util.js';

import type { CreateTrainerDto } from './create-trainer.dto.js';
import type { UpdateTrainerDto } from './update-trainer.dto.js';
import type {
  ListTrainersFilter,
  TrainerPickerResult,
  TrainerResult,
  TrainerState,
} from './trainers.types.js';

type TrainerRow = typeof trainers.$inferSelect;

@Injectable()
export class TrainersService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly authorization: AuthorizationService,
  ) {}

  async create(companyId: string, input: CreateTrainerDto): Promise<TrainerResult> {
    try {
      const [row] = await this.db
        .insert(trainers)
        .values({
          companyId,
          fullName: input.fullName,
          documentNumber: input.documentNumber,
          phone: input.phone ?? null,
          hiredAt: input.hiredAt ?? null,
          salary: input.salary ?? null,
          maxClients: input.maxClients ?? null,
          certifications: input.certifications ?? null,
        })
        .returning();

      // Recién creado: 0 clientes asignados todavía.
      return this.toFullResult(assertDefined(row, 'INSERT into trainers did not return a row.'), 0);
    } catch (error) {
      if (pgErrorCode(error) === PG_UNIQUE_VIOLATION) {
        throw new ConflictException('Ya existe un entrenador con ese documento.');
      }
      throw error;
    }
  }

  /**
   * RF-22 a RF-25. La forma de cada fila depende de si quien llama tiene
   * `entrenadores.update` (Administrador): sin ese permiso, se devuelve la
   * proyección limitada que exige el seed de permisos (sin salario ni
   * datos administrativos) — ver `TrainerPickerResult`.
   */
  async findAll(
    companyId: string,
    roleId: number,
    filter: ListTrainersFilter,
  ): Promise<readonly (TrainerPickerResult | TrainerResult)[]> {
    const conditions = [eq(trainers.companyId, companyId)];
    if (filter.state !== undefined) {
      conditions.push(eq(trainers.state, filter.state));
    }

    const rows = await this.db
      .select()
      .from(trainers)
      .where(and(...conditions))
      .orderBy(trainers.fullName);

    const counts = await this.assignedClientCounts(
      companyId,
      rows.map((row) => row.id),
    );
    const canViewSensitive = await this.authorization.hasPermissions(
      companyId,
      roleId,
      ['entrenadores.update'],
    );

    return rows.map((row) => {
      const assigned = counts.get(row.id) ?? 0;
      return canViewSensitive
        ? this.toFullResult(row, assigned)
        : this.toPickerResult(row, assigned);
    });
  }

  async findOne(
    companyId: string,
    roleId: number,
    id: string,
  ): Promise<TrainerPickerResult | TrainerResult> {
    const row = await this.loadTrainer(companyId, id);
    const counts = await this.assignedClientCounts(companyId, [id]);
    const assigned = counts.get(id) ?? 0;

    const canViewSensitive = await this.authorization.hasPermissions(
      companyId,
      roleId,
      ['entrenadores.update'],
    );
    return canViewSensitive
      ? this.toFullResult(row, assigned)
      : this.toPickerResult(row, assigned);
  }

  async update(
    companyId: string,
    id: string,
    input: UpdateTrainerDto,
  ): Promise<TrainerResult> {
    await this.loadTrainer(companyId, id);

    const patch: Partial<typeof trainers.$inferInsert> = {};
    if (input.fullName !== undefined) patch.fullName = input.fullName;
    if (input.phone !== undefined) patch.phone = input.phone;
    if (input.hiredAt !== undefined) patch.hiredAt = input.hiredAt;
    if (input.salary !== undefined) patch.salary = input.salary;
    if (input.maxClients !== undefined) patch.maxClients = input.maxClients;
    if (input.state !== undefined) patch.state = input.state;
    if (input.certifications !== undefined) patch.certifications = input.certifications;

    if (Object.keys(patch).length > 0) {
      await this.db
        .update(trainers)
        .set({ ...patch, updatedAt: new Date().toISOString() })
        .where(eq(trainers.id, id));
    }

    const counts = await this.assignedClientCounts(companyId, [id]);
    const updated = await this.loadTrainer(companyId, id);
    return this.toFullResult(updated, counts.get(id) ?? 0);
  }

  /**
   * Sin `ON DELETE CASCADE` en `client_memberships.trainer_id` ni en
   * `trainer_commissions.trainer_id` (ver migración 001): PostgreSQL
   * protege el historial. Se traduce ese rechazo a un 409 en vez de dejar
   * pasar el error crudo, igual que en membership-types.
   */
  async remove(companyId: string, id: string): Promise<void> {
    await this.loadTrainer(companyId, id);

    try {
      await this.db
        .delete(trainers)
        .where(and(eq(trainers.id, id), eq(trainers.companyId, companyId)));
    } catch (error) {
      if (pgErrorCode(error) === PG_FOREIGN_KEY_VIOLATION) {
        throw new ConflictException(
          'No se puede eliminar: tiene clientes o comisiones asociadas. Desactívalo en su lugar (PATCH state=2).',
        );
      }
      throw error;
    }
  }

  private async loadTrainer(companyId: string, id: string): Promise<TrainerRow> {
    const [row] = await this.db
      .select()
      .from(trainers)
      .where(and(eq(trainers.id, id), eq(trainers.companyId, companyId)));
    if (!row) {
      throw new NotFoundException('El entrenador no existe.');
    }
    return row;
  }

  /** RF-25: cuántos clientes tienen HOY una membresía vigente (state=1) con este entrenador. */
  private async assignedClientCounts(
    companyId: string,
    trainerIds: readonly string[],
  ): Promise<Map<string, number>> {
    if (trainerIds.length === 0) {
      return new Map();
    }

    const rows = await this.db
      .select({
        trainerId: clientMemberships.trainerId,
        count: sql<number>`count(*)::int`,
      })
      .from(clientMemberships)
      .where(
        and(
          eq(clientMemberships.companyId, companyId),
          eq(clientMemberships.state, 1),
          inArray(clientMemberships.trainerId, [...trainerIds]),
        ),
      )
      .groupBy(clientMemberships.trainerId);

    const counts = new Map<string, number>();
    for (const row of rows) {
      if (row.trainerId !== null) {
        counts.set(row.trainerId, row.count);
      }
    }
    return counts;
  }

  private toPickerResult(row: TrainerRow, assignedClientCount: number): TrainerPickerResult {
    return {
      id: row.id,
      fullName: row.fullName,
      state: row.state as TrainerState,
      maxClients: row.maxClients,
      assignedClientCount,
    };
  }

  private toFullResult(row: TrainerRow, assignedClientCount: number): TrainerResult {
    return {
      ...this.toPickerResult(row, assignedClientCount),
      documentNumber: row.documentNumber,
      phone: row.phone,
      hiredAt: row.hiredAt,
      salary: row.salary,
      certifications: row.certifications,
    };
  }
}
