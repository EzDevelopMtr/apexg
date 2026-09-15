import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';

import { DATABASE } from '../database/database.constants.js';
import type { Database } from '../database/database.types.js';
import {
  clientMemberships,
  clients,
  dailyLogs,
  membershipTypes,
  payments,
} from '../database/schema/schema.js';
// Value import: constructor-injected (see the note in access-token.guard.ts).
import { FinanceService } from '../finance/finance.service.js';
import { today } from '../shared/date.util.js';
import { PG_UNIQUE_VIOLATION, pgErrorCode } from '../shared/pg-error.util.js';

import type { CreateDailyLogDto } from './create-daily-log.dto.js';
import type { DailyLogSummary, NewClientSummary } from './daily-log.types.js';
import type { UpdateDailyLogDto } from './update-daily-log.dto.js';

type DailyLogRow = typeof dailyLogs.$inferSelect;

@Injectable()
export class DailyLogService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly finance: FinanceService,
  ) {}

  /** RF-34: la bitácora de un día (hoy por defecto) + lo derivado de Pagos y Clientes. */
  async getSummary(companyId: string, date: string): Promise<DailyLogSummary> {
    const [log, { income }, newClients] = await Promise.all([
      this.findLog(companyId, date),
      this.finance.getBalance(companyId, date, date),
      this.newClientsOn(companyId, date),
    ]);

    return {
      date,
      observations: log?.observations ?? null,
      updatedAt: log?.updatedAt ?? null,
      todayIncome: income,
      newClients,
    };
  }

  async create(
    companyId: string,
    userId: string,
    input: CreateDailyLogDto,
  ): Promise<DailyLogSummary> {
    const date = input.date ?? today();

    try {
      await this.db.insert(dailyLogs).values({
        companyId,
        logDate: date,
        observations: input.observations ?? null,
        createdBy: userId,
      });
    } catch (error) {
      if (pgErrorCode(error) === PG_UNIQUE_VIOLATION) {
        throw new ConflictException(
          `Ya existe una bitácora para ${date}; usa PATCH /daily-log/${date} para editarla.`,
        );
      }
      throw error;
    }

    return this.getSummary(companyId, date);
  }

  async update(
    companyId: string,
    date: string,
    input: UpdateDailyLogDto,
  ): Promise<DailyLogSummary> {
    await this.loadLog(companyId, date);

    await this.db
      .update(dailyLogs)
      .set({ observations: input.observations, updatedAt: new Date().toISOString() })
      .where(and(eq(dailyLogs.companyId, companyId), eq(dailyLogs.logDate, date)));

    return this.getSummary(companyId, date);
  }

  private async findLog(companyId: string, date: string): Promise<DailyLogRow | undefined> {
    const [row] = await this.db
      .select()
      .from(dailyLogs)
      .where(and(eq(dailyLogs.companyId, companyId), eq(dailyLogs.logDate, date)));
    return row;
  }

  private async loadLog(companyId: string, date: string): Promise<DailyLogRow> {
    const row = await this.findLog(companyId, date);
    if (!row) {
      throw new NotFoundException(`No existe una bitácora para ${date}.`);
    }
    return row;
  }

  /**
   * RF-34: nombre/teléfono/forma de pago/tipo de membresía de cada cliente
   * registrado ese día. Tres consultas por lote (no una por cliente, ver el
   * patrón de `assignedClientCounts` en trainers.service.ts): un cliente
   * recién registrado normalmente ya tiene su primera membresía (se crean
   * juntas en Clientes), pero puede no tener pago todavía si aún no pagó.
   */
  private async newClientsOn(companyId: string, date: string): Promise<NewClientSummary[]> {
    const clientRows = await this.db
      .select({ id: clients.id, fullName: clients.fullName, phone: clients.phone })
      .from(clients)
      .where(and(eq(clients.companyId, companyId), eq(clients.registeredAt, date)));

    if (clientRows.length === 0) {
      return [];
    }
    const clientIds = clientRows.map((row) => row.id);

    const membershipRows = await this.db
      .select({
        id: clientMemberships.id,
        clientId: clientMemberships.clientId,
        membershipTypeName: membershipTypes.name,
      })
      .from(clientMemberships)
      .innerJoin(membershipTypes, eq(membershipTypes.id, clientMemberships.membershipTypeId))
      .where(
        and(
          eq(clientMemberships.companyId, companyId),
          inArray(clientMemberships.clientId, clientIds),
        ),
      );
    const membershipByClientId = new Map(membershipRows.map((row) => [row.clientId, row]));

    const membershipIds = membershipRows.map((row) => row.id);
    const paymentRows =
      membershipIds.length === 0
        ? []
        : await this.db
            .select({
              clientMembershipId: payments.clientMembershipId,
              paymentMethod: payments.paymentMethod,
              paidAt: payments.paidAt,
            })
            .from(payments)
            .where(
              and(
                eq(payments.companyId, companyId),
                inArray(payments.clientMembershipId, membershipIds),
              ),
            );

    const firstPaymentMethodByMembership = new Map<string, string>();
    for (const row of [...paymentRows].sort((a, b) => a.paidAt.localeCompare(b.paidAt))) {
      if (!firstPaymentMethodByMembership.has(row.clientMembershipId)) {
        firstPaymentMethodByMembership.set(row.clientMembershipId, row.paymentMethod);
      }
    }

    return clientRows.map((client) => {
      const membership = membershipByClientId.get(client.id);
      return {
        clientId: client.id,
        fullName: client.fullName,
        phone: client.phone,
        membershipType: membership?.membershipTypeName ?? null,
        paymentMethod: membership
          ? (firstPaymentMethodByMembership.get(membership.id) ?? null)
          : null,
      };
    });
  }
}
