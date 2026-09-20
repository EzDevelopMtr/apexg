import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { and, asc, desc, eq, gte, ilike, isNull } from "drizzle-orm";

import { DATABASE } from "../database/database.constants.js";
import type { Database } from "../database/database.types.js";
import {
  attendances,
  clientMemberships,
  clients,
  membershipTypes,
} from "../database/schema/schema.js";
import { assertDefined } from "../shared/assert-defined.util.js";

import {
  AttendanceQueryService,
  toStatus,
} from "./attendance-query.service.js";
import { dayStart } from "./attendance-week.util.js";
import type {
  AttendanceCandidate,
  AttendanceResult,
} from "./attendances.types.js";

/** Cliente con su plan vigente, que es lo que el panel necesita mostrar. */
const CLIENT_WITH_PLAN = {
  clientId: clients.id,
  clientName: clients.fullName,
  idNumber: clients.documentNumber,
  state: clients.state,
  membershipName: membershipTypes.name,
  weeklyVisits: membershipTypes.weeklyVisits,
  endDate: clientMemberships.endDate,
};

@Injectable()
export class AttendancesService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly queries: AttendanceQueryService,
  ) {}

  /**
   * Clientes para el panel de ingreso (RF-02: solo de esta empresa).
   *
   * Sin texto devuelve los primeros, no una lista vacía: la recepcionista no
   * siempre recuerda el nombre, y una caja que no muestra nada hasta acertar
   * las primeras letras obliga a adivinar.
   */
  async search(
    companyId: string,
    query: string,
  ): Promise<AttendanceCandidate[]> {
    const scope = query
      ? and(
          eq(clients.companyId, companyId),
          ilike(clients.fullName, `%${query}%`),
        )
      : eq(clients.companyId, companyId);

    const rows = await this.db
      .select(CLIENT_WITH_PLAN)
      .from(clients)
      .leftJoin(clientMemberships, eq(clientMemberships.clientId, clients.id))
      .leftJoin(
        membershipTypes,
        eq(membershipTypes.id, clientMemberships.membershipTypeId),
      )
      .where(scope)
      .orderBy(asc(clients.fullName))
      .limit(query ? 8 : 20);

    return Promise.all(
      rows.map(async (row) => ({
        clientId: row.clientId,
        clientName: row.clientName,
        idNumber: row.idNumber,
        status: row.membershipName === null ? null : toStatus(row.state),
        membershipName: row.membershipName,
        expirationDate: row.endDate,
        weeklyVisits: row.weeklyVisits,
        usedThisWeek: await this.queries.countThisWeek(companyId, row.clientId),
        inside: await this.queries.isInside(companyId, row.clientId),
      })),
    );
  }

  /**
   * Registra un ingreso. La hora la pone el servidor.
   *
   * Rechaza al retirado, al moroso y a quien ya gastó su cupo. Espejo de
   * `checkInRefusal` en `@apexg/core`; se repite porque este backend no
   * depende de ese paquete, y sin ello bastaría una petición a mano para
   * saltarse el control que la pantalla aplica.
   */
  async create(companyId: string, clientId: string): Promise<AttendanceResult> {
    const [client] = await this.db
      .select({
        state: clients.state,
        weeklyVisits: membershipTypes.weeklyVisits,
        membershipName: membershipTypes.name,
      })
      .from(clients)
      .leftJoin(clientMemberships, eq(clientMemberships.clientId, clients.id))
      .leftJoin(
        membershipTypes,
        eq(membershipTypes.id, clientMemberships.membershipTypeId),
      )
      .where(and(eq(clients.id, clientId), eq(clients.companyId, companyId)));

    if (!client) {
      throw new NotFoundException("El cliente no existe.");
    }
    await this.assertMayEnter(companyId, clientId, client);

    // Una fila por persona y día. Quien sale y vuelve REABRE la suya en vez de
    // abrir otra: el cupo se cuenta por días, así que una segunda fila no
    // cambiaría el conteo y solo llenaría la lista de repeticiones de la misma
    // persona.
    const todays = await this.queries.findTodaysEntry(companyId, clientId);
    if (todays) {
      await this.db
        .update(attendances)
        .set({ checkOut: null })
        .where(eq(attendances.id, todays));
      return this.queries.describe(companyId, todays);
    }

    const [row] = await this.db
      .insert(attendances)
      .values({ companyId, clientId, checkIn: new Date().toISOString() })
      .returning();

    const inserted = assertDefined(
      row,
      "INSERT into attendances did not return a row.",
    );
    return this.queries.describe(companyId, inserted.id);
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

    return this.queries.describe(companyId, open.id);
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

    return Promise.all(
      rows.map((row) => this.queries.describe(companyId, row.id)),
    );
  }

  private async assertMayEnter(
    companyId: string,
    clientId: string,
    client: {
      state: number;
      weeklyVisits: number | null;
      membershipName: string | null;
    },
  ): Promise<void> {
    if (client.membershipName === null) {
      throw new ConflictException("No tiene una membresía registrada.");
    }
    const status = toStatus(client.state);
    if (status === "inactive") {
      throw new ConflictException("Cliente retirado.");
    }
    if (status === "overdue") {
      throw new ConflictException(
        "Membresía vencida. Debe renovar para ingresar.",
      );
    }
    if (client.weeklyVisits === null) return;

    // Si ya entró hoy, volver a entrar no estrena día: el cupo se cuenta por
    // días distintos, así que salir a almorzar y regresar no debe bloquearse
    // aunque el cupo esté justo.
    const [used, enteredToday] = await Promise.all([
      this.queries.countThisWeek(companyId, clientId),
      this.queries.hasEnteredToday(companyId, clientId),
    ]);
    if (!enteredToday && used >= client.weeklyVisits) {
      throw new ConflictException("Ya usó todos sus días de esta semana.");
    }
  }
}
