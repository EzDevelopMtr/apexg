import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { and, eq } from "drizzle-orm";

import { DATABASE } from "../database/database.constants.js";
import type { Database } from "../database/database.types.js";
import { clients } from "../database/schema/schema.js";

import { ClientMembershipLookupService } from "./client-membership-lookup.service.js";
import { ClientOverdueSyncService } from "./client-overdue-sync.service.js";
import { toClientResult } from "./client-result.mapper.js";
import {
  AuthorLookupService,
  authorName,
} from "../shared/author-lookup.service.js";
import type { ClientResult, ListClientsFilter } from "./clients.types.js";
import { calculateEndDate, today } from "./membership-date.util.js";

type ClientRow = typeof clients.$inferSelect;

/**
 * Las lecturas de Clientes, aparte de las escrituras.
 *
 * Cada consulta pasa antes por `ClientOverdueSyncService`: la mora se deriva
 * de una fecha, así que sin sincronizar, un cliente vencido anoche seguiría
 * apareciendo al día hasta que alguien lo tocara.
 */
@Injectable()
export class ClientsQueryService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly overdueSync: ClientOverdueSyncService,
    private readonly memberships: ClientMembershipLookupService,
    private readonly authors: AuthorLookupService,
  ) {}

  /**
   * El nombre de quien está haciendo la acción.
   *
   * Se expone desde aquí para que `ClientsService` no tenga que inyectar
   * `AuthorLookupService` por su cuenta: ya depende de este servicio, y una
   * dependencia más lo pasaba del límite de parámetros del constructor.
   */
  authorName(userId: string): Promise<string> {
    return this.authors.nameOf(userId);
  }

  async findAll(
    companyId: string,
    filter: ListClientsFilter,
  ): Promise<ClientResult[]> {
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

    const memberships = await this.memberships.latestFor(
      rows.map((row) => row.id),
    );
    const authors = await this.authors.namesOf(rows.map((row) => row.createdBy));
    const results = rows.map((row) =>
      toClientResult(
        row,
        memberships.get(row.id) ?? null,
        authorName(authors, row.createdBy),
      ),
    );

    return filter.expiringWithinDays === undefined
      ? results
      : expiringWithin(results, filter.expiringWithinDays);
  }

  async findOne(companyId: string, id: string): Promise<ClientResult> {
    await this.overdueSync.run(companyId);

    const row = await this.load(companyId, id);
    const memberships = await this.memberships.latestFor([id]);
    return toClientResult(
      row,
      memberships.get(id) ?? null,
      await this.authors.nameOf(row.createdBy),
    );
  }

  async load(companyId: string, id: string): Promise<ClientRow> {
    const [row] = await this.db
      .select()
      .from(clients)
      .where(and(eq(clients.id, id), eq(clients.companyId, companyId)));
    if (!row) {
      throw new NotFoundException("Cliente no encontrado.");
    }
    return row;
  }
}

/** RF-10: los que vencen dentro de la ventana pedida, y siguen al día. */
function expiringWithin(
  results: readonly ClientResult[],
  withinDays: number,
): ClientResult[] {
  const from = today();
  const to = calculateEndDate(from, withinDays, "day");
  return results.filter(
    (client) =>
      client.state === 1 &&
      client.currentMembership !== null &&
      client.currentMembership.endDate >= from &&
      client.currentMembership.endDate <= to,
  );
}
