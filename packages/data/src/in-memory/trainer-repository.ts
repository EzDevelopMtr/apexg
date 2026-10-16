import type {
  Commission,
  PaymentMethod,
  Trainer,
  TrainerId,
} from "@apexg/core";
import { toTrainerId, today } from "@apexg/core";
import type { TrainerRepository } from "../repositories";
import { RecordNotFoundError } from "../repositories";
import { InMemoryStore, newId } from "./in-memory-store";

export class InMemoryTrainerRepository implements TrainerRepository {
  readonly #trainers: InMemoryStore<TrainerId, Trainer>;
  readonly #commissions: InMemoryStore<string, Commission>;

  constructor(
    trainers: readonly Trainer[] = [],
    commissions: readonly Commission[] = [],
  ) {
    this.#trainers = new InMemoryStore(trainers);
    this.#commissions = new InMemoryStore(commissions);
  }

  list(): Promise<readonly Trainer[]> {
    return this.#trainers.list();
  }

  findById(id: TrainerId): Promise<Trainer | undefined> {
    return this.#trainers.findById(id);
  }

  create(draft: Omit<Trainer, "id">): Promise<Trainer> {
    return this.#trainers.save({ ...draft, id: toTrainerId(newId()) });
  }

  async update(trainer: Trainer): Promise<Trainer> {
    if (!this.#trainers.has(trainer.id)) {
      throw new RecordNotFoundError("trainer", trainer.id);
    }
    return this.#trainers.save(trainer);
  }

  listCommissions(): Promise<readonly Commission[]> {
    return this.#commissions.list();
  }

  recordCommission(draft: Omit<Commission, "id">): Promise<Commission> {
    return this.#commissions.save({ ...draft, id: newId() });
  }

  /** All or nothing, like the real API: nothing is saved if one id fails. */
  async settleCommissions(
    trainerId: TrainerId,
    commissionIds: readonly string[],
    method: PaymentMethod,
    receipt?: Blob,
  ): Promise<void> {
    const all = await this.#commissions.list();
    const chosen = commissionIds.map((id) => {
      const found = all.find(
        (commission) =>
          commission.id === id && commission.trainerId === trainerId,
      );
      if (!found || found.settled)
        throw new RecordNotFoundError("commission", id);
      return found;
    });
    for (const commission of chosen) {
      await this.#commissions.save({
        ...commission,
        settled: true,
        settledOn: today(),
        settlementMethod: method,
        settlementReceiptPath: receipt ? "comprobante" : "",
      });
    }
  }

  /** No server behind this one, so there is nothing to open. */
  commissionReceiptUrl(): string {
    return "";
  }
}
