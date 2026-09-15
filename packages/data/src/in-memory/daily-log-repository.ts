import type { DailyLogNote, MonthlyClosure } from "@apexg/core";
import type { DailyLogRepository } from "../repositories";
import { InMemoryStore, newId } from "./in-memory-store";

/** Monthly closures are keyed by their `YYYY-MM` month, which is unique. */
type ClosureRecord = MonthlyClosure & { readonly id: string };

export class InMemoryDailyLogRepository implements DailyLogRepository {
  readonly #notes: InMemoryStore<string, DailyLogNote>;
  readonly #closures: InMemoryStore<string, ClosureRecord>;

  constructor(
    notes: readonly DailyLogNote[] = [],
    closures: readonly MonthlyClosure[] = [],
  ) {
    this.#notes = new InMemoryStore(notes);
    this.#closures = new InMemoryStore(
      closures.map((closure) => ({ ...closure, id: closure.month })),
    );
  }

  listNotes(): Promise<readonly DailyLogNote[]> {
    return this.#notes.list();
  }

  addNote(draft: Omit<DailyLogNote, "id">): Promise<DailyLogNote> {
    return this.#notes.save({ ...draft, id: newId() });
  }

  async listClosures(): Promise<readonly MonthlyClosure[]> {
    return this.#closures.list();
  }

  async saveClosure(closure: MonthlyClosure): Promise<MonthlyClosure> {
    return this.#closures.save({ ...closure, id: closure.month });
  }
}
