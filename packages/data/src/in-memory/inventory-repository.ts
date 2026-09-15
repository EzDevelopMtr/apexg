import type { InventoryItem, InventoryItemId } from "@apexg/core";
import { toInventoryItemId } from "@apexg/core";
import type { InventoryRepository } from "../repositories";
import { RecordNotFoundError } from "../repositories";
import { InMemoryStore, newId } from "./in-memory-store";

export class InMemoryInventoryRepository implements InventoryRepository {
  readonly #store: InMemoryStore<InventoryItemId, InventoryItem>;

  constructor(initial: readonly InventoryItem[] = []) {
    this.#store = new InMemoryStore(initial);
  }

  list(): Promise<readonly InventoryItem[]> {
    return this.#store.list();
  }

  findById(id: InventoryItemId): Promise<InventoryItem | undefined> {
    return this.#store.findById(id);
  }

  create(draft: Omit<InventoryItem, "id">): Promise<InventoryItem> {
    return this.#store.save({ ...draft, id: toInventoryItemId(newId()) });
  }

  async update(item: InventoryItem): Promise<InventoryItem> {
    if (!this.#store.has(item.id)) {
      throw new RecordNotFoundError("inventory item", item.id);
    }
    return this.#store.save(item);
  }
}
