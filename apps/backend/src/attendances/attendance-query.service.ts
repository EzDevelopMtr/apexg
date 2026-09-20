import { Inject, Injectable } from "@nestjs/common";
import { and, eq, gte, isNull, lt, sql } from "drizzle-orm";

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
import type { AttendanceResult } from "./attendances.types.js";

/**
 * Zona del gimnasio.
 *
 * El conteo semanal agrupa por día LOCAL: un ingreso a las 19:00 de Bogotá es
 * la 01:00 UTC del día siguiente, y agrupar en UTC lo contaría como otro día.
 */
const LOCAL_ZONE = "America/Bogota";

/**
 * Traduce `clients.state` al estado que entiende `@apexg/core`.
 *
 * 1 = al día, 2 = retirado, 3 = en mora. `ClientOverdueSyncService` mueve a 3
 * a quien se le venció la membresía, así que aquí no se recalcula la fecha:
 * hay una sola definición de "en mora" y vive en ese servicio.
 */
export function toStatus(state: number): "active" | "inactive" | "overdue" {
  if (state === 2) return "inactive";
  return state === 3 ? "overdue" : "active";
}

/** Las lecturas del módulo, separadas para que el servicio quepa en 200 líneas. */
@Injectable()
export class AttendanceQueryService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  /**
   * Días distintos con al menos un ingreso, no ingresos.
   *
   * Salir a media tarde y volver no gasta otro día: el gimnasio vende días de
   * acceso, no entradas por el torniquete, y contar entradas castigaría a
   * quien sale a almorzar.
   */
  async countThisWeek(companyId: string, clientId: string): Promise<number> {
    const { start, end } = weekBounds(new Date());
    const rows = await this.db
      .selectDistinct({
        day: sql<string>`(${attendances.checkIn} AT TIME ZONE ${LOCAL_ZONE})::date`,
      })
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

  async isInside(companyId: string, clientId: string): Promise<boolean> {
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

  /** Id del ingreso de hoy de esa persona, si ya tiene uno. */
  async findTodaysEntry(
    companyId: string,
    clientId: string,
  ): Promise<string | null> {
    const [row] = await this.db
      .select({ id: attendances.id })
      .from(attendances)
      .where(
        and(
          eq(attendances.companyId, companyId),
          eq(attendances.clientId, clientId),
          gte(attendances.checkIn, dayStart(new Date()).toISOString()),
        ),
      )
      .limit(1);
    return row?.id ?? null;
  }

  async hasEnteredToday(companyId: string, clientId: string): Promise<boolean> {
    return (await this.findTodaysEntry(companyId, clientId)) !== null;
  }

  async describe(
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
      // Igual que en la busqueda: el LEFT JOIN puede dar null si el plan se
      // borro despues del ingreso. Seis es el acceso completo.
      weeklyVisits: found.weeklyVisits ?? 6,
      usedThisWeek: await this.countThisWeek(companyId, found.clientId),
    };
  }
}
