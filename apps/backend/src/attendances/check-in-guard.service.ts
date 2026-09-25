import { ConflictException, Injectable } from "@nestjs/common";

import {
  AttendanceQueryService,
  toStatus,
} from "./attendance-query.service.js";

/** Lo que la regla necesita saber del cliente que quiere entrar. */
export interface EntryCandidate {
  state: number;
  weeklyVisits: number | null;
  membershipName: string | null;
}

/**
 * Quién puede entrar y quién no.
 *
 * Espejo de `checkInRefusal` en `@apexg/core`; se repite porque este backend
 * no depende de ese paquete, y sin ello bastaría una petición a mano para
 * saltarse el control que la pantalla aplica.
 */
@Injectable()
export class CheckInGuardService {
  constructor(private readonly queries: AttendanceQueryService) {}

  async assertMayEnter(
    companyId: string,
    clientId: string,
    client: EntryCandidate,
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
