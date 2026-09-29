import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { and, asc, eq } from "drizzle-orm";

import { DATABASE } from "../database/database.constants.js";
import type { Database } from "../database/database.types.js";
import { dayPasses, membershipTypes } from "../database/schema/schema.js";
import { assertDefined } from "../shared/assert-defined.util.js";
import {
  AuthorLookupService,
  authorName,
} from "../shared/author-lookup.service.js";

import type { CreateDayPassDto } from "./create-day-pass.dto.js";
import type { DayPassResult } from "./day-passes.types.js";

type DayPassRow = typeof dayPasses.$inferSelect;

function toResult(row: DayPassRow, recordedBy: string): DayPassResult {
  return {
    id: row.id,
    membershipTypeId: row.membershipTypeId,
    visitorName: row.visitorName,
    visitorContact: row.visitorContact,
    amount: row.amount,
    paymentMethod: row.paymentMethod as DayPassResult["paymentMethod"],
    soldAt: row.soldAt,
    receiptPath: row.receiptPath,
    recordedBy,
  };
}

/**
 * Pases de día: un día vendido a quien no es cliente.
 *
 * Solo alta y lectura, igual que los pagos (RNF-07): un pase vendido es plata
 * que entró, y corregirlo sería reescribir el ingreso de ese día.
 */
@Injectable()
export class DayPassesService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly authors: AuthorLookupService,
  ) {}

  async create(
    companyId: string,
    userId: string,
    input: CreateDayPassDto,
    receiptPath: string | null,
  ): Promise<DayPassResult> {
    const plan = await this.dayPlan(companyId);
    const contact = input.visitorContact?.trim();

    const [inserted] = await this.db
      .insert(dayPasses)
      .values({
        companyId,
        membershipTypeId: plan.id,
        visitorName: input.visitorName.trim(),
        visitorContact: contact ? contact : null,
        amount: plan.price,
        paymentMethod: input.paymentMethod,
        receiptPath,
        createdBy: userId,
      })
      .returning();
    const row = assertDefined(inserted, "INSERT into day_passes did not return a row.");
    return toResult(row, await this.authors.nameOf(userId));
  }

  async findAll(companyId: string): Promise<DayPassResult[]> {
    const rows = await this.db
      .select()
      .from(dayPasses)
      .where(eq(dayPasses.companyId, companyId))
      .orderBy(dayPasses.soldAt);
    const authors = await this.authors.namesOf(rows.map((row) => row.createdBy));
    return rows.map((row) => toResult(row, authorName(authors, row.createdBy)));
  }

  async findOne(companyId: string, id: string): Promise<DayPassResult> {
    const [row] = await this.db
      .select()
      .from(dayPasses)
      .where(and(eq(dayPasses.id, id), eq(dayPasses.companyId, companyId)));
    if (!row) {
      throw new NotFoundException("El pase de día no existe.");
    }
    return toResult(row, await this.authors.nameOf(row.createdBy));
  }

  /**
   * El plan regular activo que dura exactamente un día; el más barato si hay
   * varios. Espejo de `dayPassPlan` en `@apexg/core`, que es la fuente: se
   * repite porque este backend no depende de ese paquete, y el precio lo
   * tiene que decidir la API, no el formulario.
   */
  private async dayPlan(companyId: string) {
    const [plan] = await this.db
      .select({ id: membershipTypes.id, price: membershipTypes.price })
      .from(membershipTypes)
      .where(
        and(
          eq(membershipTypes.companyId, companyId),
          eq(membershipTypes.state, 1),
          eq(membershipTypes.isPromotional, false),
          eq(membershipTypes.durationUnit, "day"),
          eq(membershipTypes.durationValue, 1),
        ),
      )
      .orderBy(asc(membershipTypes.price))
      .limit(1);
    if (!plan) {
      throw new BadRequestException(
        "No hay un plan de un día en el catálogo. Créalo en Membresías para vender pases.",
      );
    }
    return plan;
  }
}
