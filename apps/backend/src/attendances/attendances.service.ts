import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { and, asc, desc, eq, gte, ilike, isNull, lt } from "drizzle-orm";

import { DATABASE } from "../database/database.constants.js";
import type { Database } from "../database/database.types.js";
import {
  attendances,
  clientMemberships,
  clients,
  membershipTypes,
} from "../database/schema/schema.js";
import { assertDefined } from "../shared/assert-defined.util.js";

import { dayStart, weekBounds } from "./attendance-week.util.js";
import type {
  AttendanceCandidate,
  AttendanceResult,
} from "./attendances.types.js";

/** Cliente con su plan vigente, que es lo que el panel necesita mostrar. */
const CLIENT_WITH_PLAN = {
  clientId: clients.id,
  clientName: clients.fullName,
  idNumber: clients.documentNumber,
  membershipName: membershipTypes.name,
  weeklyVisits: membershipTypes.weeklyVisits,
  endDate: clientMemberships.endDate,
};

@Injectable()
export class AttendancesService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  /** Busca por nombre para el panel de ingreso (RF-02: solo de esta empresa). */
  async search(
    companyId: string,
    query: string,
  ): Promise<AttendanceCandidate[]> {
    const rows = await this.db
      .select(CLIENT_WITH_PLAN)
      .from(clients)
      .leftJoin(clientMemberships, eq(clientMemberships.clientId, clients.id))
      .leftJoin(
        membershipTypes,
        eq(membershipTypes.id, clientMemberships.membershipTypeId),
      )
      .where(
        and(
          eq(clients.companyId, companyId),
          ilike(clients.fullName, `%${query}%`),
        ),
      )
      .orderBy(asc(clients.fullName))
      .limit(8);

    return Promise.all(
      rows.map(async (row) => ({
        clientId: row.clientId,
        clientName: row.clientName,
        idNumber: row.idNumber,
        membershipName: row.membershipName,
        expirationDate: row.endDate,
        weeklyVisits: row.weeklyVisits,
        usedThisWeek: await this.countThisWeek(companyId, row.clientId),
        inside: await this.isInside(companyId, row.clientId),
      })),
    );
  }

  /** Registra un ingreso. La hora la pone el servidor. */
  async create(companyId: string, clientId: string): Promise<AttendanceResult> {
    const [client] = await this.db
      .select({ id: clients.id })
      .from(clients)
      .where(and(eq(clients.id, clientId), eq(clients.companyId, companyId)));
    if (!client) {
      throw new NotFoundException("El cliente no existe.");
    }

    const [row] = await this.db
      .insert(attendances)
      .values({ companyId, clientId, checkIn: new Date().toISOString() })
      .returning();

    const inserted = assertDefined(
      row,
      "INSERT into attendances did not return a row.",
    );
    return this.describe(companyId, inserted.id);
  }

  /**
   * Marca la salida del ingreso abierto de ese cliente.
   *
   * No recibe el id del ingreso: la recepcionista ve una persona, no una fila.
   * Si hubiera más de uno abierto (no debería), cierra el más reciente.
   */
  async checkOut(
    companyId: string,
    clientId: string,
  ): Promise<AttendanceResult> {
    const [open] = await this.db
      .select({ id: attendances.id })
      .from(attendances)
      .where(
        and(
          eq(attendances.companyId, companyId),
          eq(attendances.clientId, clientId),
          isNull(attendances.checkOut),
        ),
      )
      .orderBy(desc(attendances.checkIn))
      .limit(1);

    if (!open) {
      throw new NotFoundException("Esa persona no tiene un ingreso abierto.");
    }

    await this.db
      .update(attendances)
      .set({ checkOut: new Date().toISOString() })
      .where(eq(attendances.id, open.id));

    return this.describe(companyId, open.id);
  }

  /** Ingresos de hoy, el más reciente primero. */
  async findToday(companyId: string): Promise<AttendanceResult[]> {
    const rows = await this.db
      .select({ id: attendances.id })
      .from(attendances)
      .where(
        and(
          eq(attendances.companyId, companyId),
          gte(attendances.checkIn, dayStart(new Date()).toISOString()),
        ),
      )
      .orderBy(desc(attendances.checkIn));

    return Promise.all(rows.map((row) => this.describe(companyId, row.id)));
  }

  private async countThisWeek(
    companyId: string,
    clientId: string,
  ): Promise<number> {
    const { start, end } = weekBounds(new Date());
    const rows = await this.db
      .select({ id: attendances.id })
      .from(attendances)
      .where(
        and(
          eq(attendances.companyId, companyId),
          eq(attendances.clientId, clientId),
          gte(attendances.checkIn, start.toISOString()),
          lt(attendances.checkIn, end.toISOString()),
        ),
      );
    return rows.length;
  }

  private async isInside(
    companyId: string,
    clientId: string,
  ): Promise<boolean> {
    const [open] = await this.db
      .select({ id: attendances.id })
      .from(attendances)
      .where(
        and(
          eq(attendances.companyId, companyId),
          eq(attendances.clientId, clientId),
          isNull(attendances.checkOut),
        ),
      )
      .limit(1);
    return Boolean(open);
  }

  private async describe(
    companyId: string,
    attendanceId: string,
  ): Promise<AttendanceResult> {
    const [row] = await this.db
      .select({
        id: attendances.id,
        clientId: attendances.clientId,
        clientName: clients.fullName,
        checkIn: attendances.checkIn,
        checkOut: attendances.checkOut,
        membershipName: membershipTypes.name,
        weeklyVisits: membershipTypes.weeklyVisits,
      })
      .from(attendances)
      .innerJoin(clients, eq(clients.id, attendances.clientId))
      .leftJoin(clientMemberships, eq(clientMemberships.clientId, clients.id))
      .leftJoin(
        membershipTypes,
        eq(membershipTypes.id, clientMemberships.membershipTypeId),
      )
      .where(eq(attendances.id, attendanceId));

    const found = assertDefined(
      row,
      "La asistencia recién escrita no se pudo leer.",
    );
    return {
      ...found,
      usedThisWeek: await this.countThisWeek(companyId, found.clientId),
    };
  }
}
