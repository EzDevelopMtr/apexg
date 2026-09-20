import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { and, eq } from "drizzle-orm";

import { DATABASE } from "../database/database.constants.js";
import type { Database } from "../database/database.types.js";
import { membershipTypes } from "../database/schema/schema.js";
import { assertDefined } from "../shared/assert-defined.util.js";
import {
  PG_FOREIGN_KEY_VIOLATION,
  PG_UNIQUE_VIOLATION,
  pgErrorCode,
} from "../shared/pg-error.util.js";

import type { CreateMembershipTypeDto } from "./create-membership-type.dto.js";
import type { UpdateMembershipTypeDto } from "./update-membership-type.dto.js";
import { mergePatch, toResult } from "./membership-type-mapper.js";
import type {
  ListMembershipTypesFilter,
  MembershipTypeResult,
} from "./membership-types.types.js";
import { validateMembershipTypePlan } from "./membership-type-validation.js";
import type { MembershipTypePlan } from "./membership-type-validation.js";

type MembershipTypeRow = typeof membershipTypes.$inferSelect;

@Injectable()
export class MembershipTypesService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async create(
    companyId: string,
    input: CreateMembershipTypeDto,
  ): Promise<MembershipTypeResult> {
    validateMembershipTypePlan(this.planFromCreate(input));

    try {
      const [row] = await this.db
        .insert(membershipTypes)
        .values({
          companyId,
          name: input.name,
          price: input.price,
          description: input.description ?? null,
          durationValue: input.durationValue,
          durationUnit: input.durationUnit,
          minimumPayment: input.minimumPayment ?? null,
          trainerShare: input.trainerShare ?? null,
          businessShare: input.businessShare ?? null,
          allowsPartialPayment: input.allowsPartialPayment ?? false,
          isPromotional: input.isPromotional ?? false,
          weeklyVisits: input.weeklyVisits ?? null,
        })
        .returning();

      return toResult(
        assertDefined(
          row,
          "INSERT into membership_types did not return a row.",
        ),
      );
    } catch (error) {
      if (pgErrorCode(error) === PG_UNIQUE_VIOLATION) {
        throw new ConflictException("Ya existe un plan con ese nombre.");
      }
      throw error;
    }
  }

  async findAll(
    companyId: string,
    filter: ListMembershipTypesFilter,
  ): Promise<MembershipTypeResult[]> {
    const conditions = [eq(membershipTypes.companyId, companyId)];
    if (filter.state !== undefined) {
      conditions.push(eq(membershipTypes.state, filter.state));
    }
    if (filter.isPromotional !== undefined) {
      conditions.push(eq(membershipTypes.isPromotional, filter.isPromotional));
    }

    const rows = await this.db
      .select()
      .from(membershipTypes)
      .where(and(...conditions))
      .orderBy(membershipTypes.name);

    return rows.map((row) => toResult(row));
  }

  async findOne(companyId: string, id: string): Promise<MembershipTypeResult> {
    return toResult(await this.loadPlan(companyId, id));
  }

  async update(
    companyId: string,
    id: string,
    input: UpdateMembershipTypeDto,
  ): Promise<MembershipTypeResult> {
    const existing = await this.loadPlan(companyId, id);

    const merged = mergePatch(existing, input);
    validateMembershipTypePlan(merged);

    try {
      await this.db
        .update(membershipTypes)
        .set({
          name: merged.name,
          price: merged.price,
          description: merged.description,
          durationValue: merged.durationValue,
          durationUnit: merged.durationUnit,
          minimumPayment: merged.minimumPayment,
          trainerShare: merged.trainerShare,
          businessShare: merged.businessShare,
          allowsPartialPayment: merged.allowsPartialPayment,
          isPromotional: merged.isPromotional,
          weeklyVisits: merged.weeklyVisits,
          state: merged.state,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(membershipTypes.id, id));
    } catch (error) {
      if (pgErrorCode(error) === PG_UNIQUE_VIOLATION) {
        throw new ConflictException("Ya existe un plan con ese nombre.");
      }
      throw error;
    }

    return this.findOne(companyId, id);
  }

  /**
   * RF-12 "eliminar". Un DELETE real: PostgreSQL rechaza con FK violation
   * si algún `client_memberships` ya referencia este plan (no hay
   * `ON DELETE CASCADE` — ver migración 001), así que un plan con
   * historial queda protegido sin lógica adicional aquí. Se traduce ese
   * rechazo a un mensaje claro en vez de dejar pasar el error crudo de
   * PostgreSQL.
   */
  async remove(companyId: string, id: string): Promise<void> {
    await this.loadPlan(companyId, id);

    try {
      await this.db
        .delete(membershipTypes)
        .where(
          and(
            eq(membershipTypes.id, id),
            eq(membershipTypes.companyId, companyId),
          ),
        );
    } catch (error) {
      if (pgErrorCode(error) === PG_FOREIGN_KEY_VIOLATION) {
        throw new ConflictException(
          "No se puede eliminar: hay clientes con este plan. Desactívalo en su lugar (PATCH state=2).",
        );
      }
      throw error;
    }
  }

  private async loadPlan(
    companyId: string,
    id: string,
  ): Promise<MembershipTypeRow> {
    const [row] = await this.db
      .select()
      .from(membershipTypes)
      .where(
        and(
          eq(membershipTypes.id, id),
          eq(membershipTypes.companyId, companyId),
        ),
      );
    if (!row) {
      throw new NotFoundException("El tipo de membresía no existe.");
    }
    return row;
  }

  private planFromCreate(input: CreateMembershipTypeDto): MembershipTypePlan {
    return {
      price: input.price,
      minimumPayment: input.minimumPayment ?? null,
      trainerShare: input.trainerShare ?? null,
      businessShare: input.businessShare ?? null,
      allowsPartialPayment: input.allowsPartialPayment ?? false,
      isPromotional: input.isPromotional ?? false,
    };
  }
}
