import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { and, desc, eq, gte, sql } from "drizzle-orm";

import { DATABASE } from "../database/database.constants.js";
import type { Database } from "../database/database.types.js";
import { clientReminders, clients, users } from "../database/schema/schema.js";

/** El último recordatorio de un cliente, para la marca de la lista. */
export interface LatestReminder {
  clientId: string;
  sentAt: string;
  sentByName: string | null;
}

/** Más atrás ya no ayuda a decidir si escribirle hoy. */
const LOOKBACK_DAYS = 30;

@Injectable()
export class ClientRemindersService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  /** Registra que se abrió el chat con el recordatorio. La hora la pone el servidor. */
  async record(companyId: string, userId: string, clientId: string): Promise<LatestReminder> {
    const [client] = await this.db
      .select({ id: clients.id })
      .from(clients)
      .where(and(eq(clients.id, clientId), eq(clients.companyId, companyId)));
    if (!client) throw new NotFoundException("Cliente no encontrado.");

    const [row] = await this.db
      .insert(clientReminders)
      .values({ companyId, clientId, sentBy: userId })
      .returning({ sentAt: clientReminders.sentAt });
    const [user] = await this.db
      .select({ fullName: users.fullName })
      .from(users)
      .where(eq(users.id, userId));
    return { clientId, sentAt: row?.sentAt ?? new Date().toISOString(), sentByName: user?.fullName ?? null };
  }

  /** El más reciente de cada cliente en los últimos días (RF-02: solo de esta empresa). */
  latest(companyId: string): Promise<LatestReminder[]> {
    return this.db
      .selectDistinctOn([clientReminders.clientId], {
        clientId: clientReminders.clientId,
        sentAt: clientReminders.sentAt,
        sentByName: users.fullName,
      })
      .from(clientReminders)
      .leftJoin(users, eq(users.id, clientReminders.sentBy))
      .where(
        and(
          eq(clientReminders.companyId, companyId),
          gte(clientReminders.sentAt, sql`NOW() - make_interval(days => ${LOOKBACK_DAYS})`),
        ),
      )
      .orderBy(clientReminders.clientId, desc(clientReminders.sentAt));
  }
}
