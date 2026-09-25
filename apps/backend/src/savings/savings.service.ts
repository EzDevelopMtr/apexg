import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, desc, eq, gte, lte, sql } from 'drizzle-orm';

import { DATABASE } from '../database/database.constants.js';
import type { Database } from '../database/database.types.js';
import {
  savingsContributions,
  savingsPockets,
  users,
} from '../database/schema/schema.js';
import { assertDefined } from '../shared/assert-defined.util.js';
import { today } from '../shared/date.util.js';

import type { CreateContributionDto } from './create-contribution.dto.js';
import type { CreateSavingsPocketDto } from './create-savings-pocket.dto.js';
import type {
  ListContributionsFilter,
  SavingsContributionResult,
  SavingsPocketResult,
} from './savings.types.js';
import type { UpdateSavingsPocketDto } from './update-savings-pocket.dto.js';

/**
 * Lo ahorrado se suma en la base, no en el cliente.
 *
 * Traer todos los aportes solo para sumarlos crecería con los años y volvería
 * lenta la primera pantalla de finanzas; el total cabe en una columna.
 *
 * LEFT JOIN agrupado y no subconsulta correlacionada: Drizzle no correlaciona
 * el `${savingsPockets.id}` de dentro de un `sql` con la fila de fuera, y la
 * suma volvía en cero para todos los bolsillos.
 */
// `::numeric(12,2)` antes del `::text`: sin él, la suma vacía sale como
// "0" y no como "0.00", y el cliente rechaza ese formato — el contrato con
// el frontend es que un NUMERIC(_,2) siempre viaja con sus dos decimales.
const SAVED_AMOUNT = sql<string>`COALESCE(SUM(${savingsContributions.amount}), 0)::numeric(12,2)::text`;

const POCKET_COLUMNS = {
  id: savingsPockets.id,
  name: savingsPockets.name,
  goalAmount: savingsPockets.goalAmount,
  closed: savingsPockets.closed,
  savedAmount: SAVED_AMOUNT,
  createdAt: savingsPockets.createdAt,
};

@Injectable()
export class SavingsService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async createPocket(
    companyId: string,
    userId: string,
    input: CreateSavingsPocketDto,
  ): Promise<SavingsPocketResult> {
    const [row] = await this.db
      .insert(savingsPockets)
      .values({
        companyId,
        name: input.name.trim(),
        goalAmount: input.goalAmount,
        createdBy: userId,
      })
      .returning();

    const created = assertDefined(
      row,
      'INSERT into savings_pockets did not return a row.',
    );
    return {
      id: created.id,
      name: created.name,
      goalAmount: created.goalAmount,
      closed: created.closed,
      savedAmount: '0.00',
      createdAt: created.createdAt,
    };
  }

  async listPockets(companyId: string): Promise<SavingsPocketResult[]> {
    return this.db
      .select(POCKET_COLUMNS)
      .from(savingsPockets)
      .leftJoin(
        savingsContributions,
        eq(savingsContributions.pocketId, savingsPockets.id),
      )
      .where(eq(savingsPockets.companyId, companyId))
      .groupBy(savingsPockets.id)
      // Los abiertos primero: los cerrados son historial.
      .orderBy(asc(savingsPockets.closed), asc(savingsPockets.name));
  }

  async updatePocket(
    companyId: string,
    id: string,
    input: UpdateSavingsPocketDto,
  ): Promise<SavingsPocketResult> {
    await this.loadPocket(companyId, id);

    // `undefined` es "no lo toques"; `??` confundiría eso con un valor.
    await this.db
      .update(savingsPockets)
      .set({
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.goalAmount !== undefined
          ? { goalAmount: input.goalAmount }
          : {}),
        ...(input.closed !== undefined ? { closed: input.closed } : {}),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(savingsPockets.id, id));

    const [updated] = await this.listPocketsById(companyId, id);
    return assertDefined(updated, 'El bolsillo desapareció al actualizarlo.');
  }

  /**
   * Registra un aporte. Espejo de `contributionRefusal` en `@apexg/core`: la
   * pantalla aplica la misma regla, pero sin esto bastaría una petición a
   * mano para abonar a un bolsillo cerrado.
   */
  async contribute(
    companyId: string,
    userId: string,
    pocketId: string,
    input: CreateContributionDto,
  ): Promise<SavingsContributionResult> {
    const pocket = await this.loadPocket(companyId, pocketId);
    if (pocket.closed) {
      throw new ConflictException(
        'Ese bolsillo está cerrado: no admite aportes nuevos.',
      );
    }

    const [row] = await this.db
      .insert(savingsContributions)
      .values({
        companyId,
        pocketId,
        amount: input.amount,
        savedOn: input.savedOn ?? today(),
        notes: input.notes ?? null,
        createdBy: userId,
      })
      .returning();

    const created = assertDefined(
      row,
      'INSERT into savings_contributions did not return a row.',
    );
    const [author] = await this.db
      .select({ fullName: users.fullName })
      .from(users)
      .where(eq(users.id, userId));

    return {
      id: created.id,
      pocketId: created.pocketId,
      amount: created.amount,
      savedOn: created.savedOn,
      notes: created.notes,
      recordedBy: author?.fullName ?? '',
    };
  }

  async listContributions(
    companyId: string,
    filter: ListContributionsFilter,
  ): Promise<SavingsContributionResult[]> {
    const conditions = [eq(savingsContributions.companyId, companyId)];
    if (filter.pocketId !== undefined) {
      conditions.push(eq(savingsContributions.pocketId, filter.pocketId));
    }
    if (filter.from !== undefined) {
      conditions.push(gte(savingsContributions.savedOn, filter.from));
    }
    if (filter.to !== undefined) {
      conditions.push(lte(savingsContributions.savedOn, filter.to));
    }

    return this.db
      .select({
        id: savingsContributions.id,
        pocketId: savingsContributions.pocketId,
        amount: savingsContributions.amount,
        savedOn: savingsContributions.savedOn,
        notes: savingsContributions.notes,
        recordedBy: users.fullName,
      })
      .from(savingsContributions)
      .innerJoin(users, eq(users.id, savingsContributions.createdBy))
      .where(and(...conditions))
      .orderBy(desc(savingsContributions.savedOn), desc(savingsContributions.createdAt));
  }

  private async listPocketsById(
    companyId: string,
    id: string,
  ): Promise<SavingsPocketResult[]> {
    return this.db
      .select(POCKET_COLUMNS)
      .from(savingsPockets)
      .leftJoin(
        savingsContributions,
        eq(savingsContributions.pocketId, savingsPockets.id),
      )
      .where(and(eq(savingsPockets.companyId, companyId), eq(savingsPockets.id, id)))
      .groupBy(savingsPockets.id);
  }

  private async loadPocket(companyId: string, id: string) {
    const [pocket] = await this.db
      .select()
      .from(savingsPockets)
      .where(and(eq(savingsPockets.id, id), eq(savingsPockets.companyId, companyId)));

    if (!pocket) {
      throw new NotFoundException('Ese bolsillo no existe.');
    }
    return pocket;
  }
}
