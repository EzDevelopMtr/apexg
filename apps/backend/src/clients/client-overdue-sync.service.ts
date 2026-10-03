import { Inject, Injectable } from "@nestjs/common";
import { sql } from "drizzle-orm";

import { DATABASE } from "../database/database.constants.js";
import type { Database } from "../database/database.types.js";
// Value import: constructor-injected (see the note in access-token.guard.ts).
import { SettingsService } from "../settings/settings.service.js";

/**
 * RF-21: pasa a "en mora" (state = 3) a los clientes activos cuya
 * membresía MÁS RECIENTE ya venció. Se ejecuta en cada lectura porque
 * este backend todavía no tiene un job programado — una sola sentencia
 * UPDATE, no un bucle por cliente. Una renovación crea una fila nueva en
 * `client_memberships` con `start_date` posterior, así que deja de ser
 * "la más reciente vencida" en cuanto se registra.
 *
 * No toca `client_memberships.state` (vigente/vencida/cancelada): esa
 * transición depende de si hubo un pago que renovó, que es lógica del
 * módulo de Pagos, no de Clientes.
 *
 * Su propia clase (no un método de `ClientsService`) porque Finanzas
 * también la necesita antes de contar clientes en mora (RF-35): es la
 * misma regla de RF-21, no una copia — un conteo sin esta sincronización
 * previa podría reportar de menos si nadie leyó `/clients` desde que
 * venció la membresía.
 */
@Injectable()
export class ClientOverdueSyncService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly settings: SettingsService,
  ) {}

  async run(companyId: string): Promise<void> {
    // Ajuste `clients.graceDays` (0 = en mora al día siguiente del vencimiento).
    const { "clients.graceDays": graceDays } = await this.settings.forCompany(companyId);
    await this.db.execute(sql`
      UPDATE clients c
      SET state = 3, updated_at = NOW()
      WHERE c.company_id = ${companyId}
        AND c.state = 1
        -- Solo la membresia ACTIVA. Antes buscaba la de mayor start_date, que
        -- empata en cuanto alguien cambia de plan el mismo dia en que empezo
        -- el anterior: el desempate quedaba al azar y podia marcar en mora
        -- mirando un periodo ya cerrado. closeCurrent garantiza que solo una
        -- este en estado 1.
        AND EXISTS (
          SELECT 1 FROM client_memberships cm
          WHERE cm.client_id = c.id
            AND cm.state = 1
            AND cm.end_date + ${graceDays}::int < CURRENT_DATE
        )
    `);
  }
}
