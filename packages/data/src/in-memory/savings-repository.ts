import type {
  IsoDate,
  Money,
  SavingsContribution,
  SavingsPocket,
  SavingsPocketId,
} from "@apexg/core";
import {
  savedInPocket,
  toSavingsContributionId,
  toSavingsPocketId,
} from "@apexg/core";
import type { SavingsRepository } from "../repositories";
import { RecordNotFoundError } from "../repositories";
import type { PocketWithSaved } from "../http/http-savings-repository";

/** Bolsillos de ahorro en memoria, para desarrollo y pruebas sin backend. */
export class InMemorySavingsRepository implements SavingsRepository {
  private pockets: SavingsPocket[] = [];
  private contributions: SavingsContribution[] = [];
  private sequence = 0;

  async listPockets(): Promise<readonly PocketWithSaved[]> {
    return this.pockets.map((pocket) => this.withSaved(pocket));
  }

  async createPocket(name: string, goal: Money): Promise<PocketWithSaved> {
    this.sequence += 1;
    const pocket: SavingsPocket = {
      id: toSavingsPocketId(`pocket-${this.sequence}`),
      name,
      goal,
      closed: false,
      createdOn: new Date().toISOString().slice(0, 10) as IsoDate,
    };
    this.pockets.push(pocket);
    return this.withSaved(pocket);
  }

  async updatePocket(
    id: SavingsPocketId,
    changes: { name?: string; goal?: Money; closed?: boolean },
  ): Promise<PocketWithSaved> {
    const index = this.pockets.findIndex((pocket) => pocket.id === id);
    const current = this.pockets[index];
    if (!current) throw new RecordNotFoundError("savings pocket", id);

    // `undefined` es "no lo toques", que no es lo mismo que un valor vacío.
    const updated: SavingsPocket = {
      ...current,
      ...(changes.name !== undefined ? { name: changes.name } : {}),
      ...(changes.goal !== undefined ? { goal: changes.goal } : {}),
      ...(changes.closed !== undefined ? { closed: changes.closed } : {}),
    };
    this.pockets[index] = updated;
    return this.withSaved(updated);
  }

  async listContributions(): Promise<readonly SavingsContribution[]> {
    return [...this.contributions];
  }

  async contribute(
    pocketId: SavingsPocketId,
    amount: Money,
    notes: string,
  ): Promise<SavingsContribution> {
    const pocket = this.pockets.find((one) => one.id === pocketId);
    if (!pocket) throw new RecordNotFoundError("savings pocket", pocketId);

    this.sequence += 1;
    const contribution: SavingsContribution = {
      id: toSavingsContributionId(`contribution-${this.sequence}`),
      pocketId,
      amount,
      contributedOn: new Date().toISOString().slice(0, 10) as IsoDate,
      notes,
      recordedBy: "Local",
    };
    this.contributions.push(contribution);
    return contribution;
  }

  private withSaved(pocket: SavingsPocket): PocketWithSaved {
    return { pocket, saved: savedInPocket(this.contributions, pocket.id) };
  }
}
