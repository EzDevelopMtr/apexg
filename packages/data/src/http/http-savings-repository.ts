import type {
  IsoDate,
  Money,
  SavingsContribution,
  SavingsPocket,
  SavingsPocketId,
} from "@apexg/core";
import {
  fromApiString,
  toApiString,
  toSavingsContributionId,
  toSavingsPocketId,
} from "@apexg/core";
import type { SavingsRepository } from "../repositories";
import { apiFetch } from "./http-client";

interface ApiPocket {
  id: string;
  name: string;
  goalAmount: string;
  closed: boolean;
  savedAmount: string;
  createdAt: string | null;
}

interface ApiContribution {
  id: string;
  pocketId: string;
  amount: string;
  savedOn: string;
  notes: string | null;
  recordedBy: string;
}

/** Lo ahorrado viaja aparte del bolsillo: lo suma la base, no el navegador. */
export interface PocketWithSaved {
  readonly pocket: SavingsPocket;
  readonly saved: Money;
}

function fromPocket(row: ApiPocket): PocketWithSaved {
  return {
    pocket: {
      id: toSavingsPocketId(row.id),
      name: row.name,
      goal: fromApiString(row.goalAmount),
      closed: row.closed,
      // `created_at` es un timestamp; al dominio solo le interesa el día.
      createdOn: (row.createdAt ?? "").slice(0, 10) as IsoDate,
    },
    saved: fromApiString(row.savedAmount),
  };
}

function fromContribution(row: ApiContribution): SavingsContribution {
  return {
    id: toSavingsContributionId(row.id),
    pocketId: toSavingsPocketId(row.pocketId),
    amount: fromApiString(row.amount),
    contributedOn: row.savedOn as IsoDate,
    notes: row.notes ?? "",
    recordedBy: row.recordedBy,
  };
}

export class HttpSavingsRepository implements SavingsRepository {
  async listPockets(): Promise<readonly PocketWithSaved[]> {
    const rows = await apiFetch<ApiPocket[]>("/savings-pockets");
    return rows.map(fromPocket);
  }

  async createPocket(name: string, goal: Money): Promise<PocketWithSaved> {
    const row = await apiFetch<ApiPocket>("/savings-pockets", {
      method: "POST",
      body: { name, goalAmount: toApiString(goal) },
    });
    return fromPocket(row);
  }

  async updatePocket(
    id: SavingsPocketId,
    changes: { name?: string; goal?: Money; closed?: boolean },
  ): Promise<PocketWithSaved> {
    const row = await apiFetch<ApiPocket>(`/savings-pockets/${id}`, {
      method: "PATCH",
      body: {
        ...(changes.name !== undefined ? { name: changes.name } : {}),
        ...(changes.goal !== undefined
          ? { goalAmount: toApiString(changes.goal) }
          : {}),
        ...(changes.closed !== undefined ? { closed: changes.closed } : {}),
      },
    });
    return fromPocket(row);
  }

  async listContributions(): Promise<readonly SavingsContribution[]> {
    const rows = await apiFetch<ApiContribution[]>("/savings-contributions");
    return rows.map(fromContribution);
  }

  async contribute(
    pocketId: SavingsPocketId,
    amount: Money,
    notes: string,
  ): Promise<SavingsContribution> {
    const row = await apiFetch<ApiContribution>(
      `/savings-pockets/${pocketId}/contributions`,
      {
        method: "POST",
        body: { amount: toApiString(amount), notes },
      },
    );
    return fromContribution(row);
  }
}
