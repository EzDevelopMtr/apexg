import type {
  Client,
  InventoryItem,
  ProductSale,
  ProductSaleId,
} from "@apexg/core";
import { toProductSaleId } from "@apexg/core";
import type { ProductSaleRepository } from "../repositories";
import { InMemoryStore, newId } from "./in-memory-store";

export class InMemoryProductSaleRepository implements ProductSaleRepository {
  readonly #store: InMemoryStore<ProductSaleId, ProductSale>;
  readonly #items: readonly InventoryItem[];
  readonly #clients: readonly Client[];

  constructor(
    initial: readonly ProductSale[] = [],
    items: readonly InventoryItem[] = [],
    clients: readonly Client[] = [],
  ) {
    this.#store = new InMemoryStore(initial);
    this.#items = items;
    this.#clients = clients;
  }

  list(): Promise<readonly ProductSale[]> {
    return this.#store.list();
  }

  async create(
    draft: Omit<ProductSale, "id" | "itemName" | "clientName">,
  ): Promise<ProductSale> {
    const item = this.#items.find(
      (candidate) => candidate.id === draft.inventoryItemId,
    );
    const client = draft.clientId
      ? this.#clients.find((candidate) => candidate.id === draft.clientId)
      : undefined;

    return this.#store.save({
      ...draft,
      id: toProductSaleId(newId()),
      itemName: item?.name ?? "—",
      clientName: client?.fullName,
    });
  }
}
