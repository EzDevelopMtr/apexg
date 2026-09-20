import { Inject, Injectable } from "@nestjs/common";
import { eq, inArray } from "drizzle-orm";

import { DATABASE } from "../database/database.constants.js";
import type { Database } from "../database/database.types.js";
import {
  clientMemberships,
  membershipTypes,
} from "../database/schema/schema.js";

import type { ClientMembershipSummary } from "./clients.types.js";
import { isNewer } from "./membership-precedence.util.js";

/**
 * Qué membresía tiene vigente cada cliente.
 *
 * Aparte de `ClientMembershipService`, que escribe: esto solo lee, y un
 * cliente puede tener varias filas desde que renovar abre una nueva en vez de
 * editar la anterior.
 */
@Injectable()
export class ClientMembershipLookupService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async latestFor(
    clientIds: readonly string[],
  ): Promise<Map<string, ClientMembershipSummary>> {
    if (clientIds.length === 0) {
      return new Map();
    }

    const rows = await this.db
      .select({
        id: clientMemberships.id,
        clientId: clientMemberships.clientId,
        state: clientMemberships.state,
        createdAt: clientMemberships.createdAt,
        membershipTypeId: clientMemberships.membershipTypeId,
        membershipTypeName: membershipTypes.name,
        trainerId: clientMemberships.trainerId,
        startDate: clientMemberships.startDate,
        endDate: clientMemberships.endDate,
        agreedPrice: clientMemberships.agreedPrice,
      })
      .from(clientMemberships)
      .innerJoin(
        membershipTypes,
        eq(membershipTypes.id, clientMemberships.membershipTypeId),
      )
      .where(inArray(clientMemberships.clientId, [...clientIds]));

    const latestByClient = new Map<string, (typeof rows)[number]>();
    for (const row of rows) {
      const current = latestByClient.get(row.clientId);
      if (!current || isNewer(row, current)) {
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
