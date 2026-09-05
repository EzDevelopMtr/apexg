/**
 * Shared in-memory storage for the repositories.
 *
 * Seven entities need the same list/find/save/remove behaviour; without this
 * each repository would repeat the Map and its four methods.
 *
 * Deliberately the only place that knows the data is not persisted: replacing
 * it with an HTTP implementation touches no consumer.
 */
export class InMemoryStore<Id, T extends { readonly id: Id }> {
  readonly #records = new Map<Id, T>();

  constructor(initial: readonly T[] = []) {
    for (const record of initial) {
      this.#records.set(record.id, record);
    }
  }

  async list(): Promise<readonly T[]> {
    return [...this.#records.values()];
  }

  async findById(id: Id): Promise<T | undefined> {
    return this.#records.get(id);
  }

  async save(record: T): Promise<T> {
    this.#records.set(record.id, record);
    return record;
  }

  async remove(id: Id): Promise<void> {
    this.#records.delete(id);
  }

  has(id: Id): boolean {
    return this.#records.has(id);
  }
}

/**
 * Ids come from the data layer, never from a component.
 *
 * `Date.now()` collides whenever two records are created inside the same
 * millisecond, which a receptionist entering a batch can do.
 */
export function newId(): string {
  return globalThis.crypto.randomUUID();
}
