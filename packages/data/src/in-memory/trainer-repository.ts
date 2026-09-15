import type { Commission, Trainer, TrainerId } from "@apexg/core";
import { toTrainerId } from "@apexg/core";
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
}
