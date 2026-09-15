import type { Client, ClientDraft, ClientId } from "@apexg/core";
import { createClient, findMembershipType, toClientId } from "@apexg/core";
import type { ClientRepository } from "../repositories";
import {
  RecordNotFoundError,
  UnknownMembershipTypeError,
} from "../repositories";
import { InMemoryStore, newId } from "./in-memory-store";

export class InMemoryClientRepository implements ClientRepository {
  readonly #store: InMemoryStore<ClientId, Client>;

  constructor(initial: readonly Client[] = []) {
    this.#store = new InMemoryStore(initial);
  }

  list(): Promise<readonly Client[]> {
    return this.#store.list();
  }

  findById(id: ClientId): Promise<Client | undefined> {
    return this.#store.findById(id);
  }

  async create(draft: ClientDraft): Promise<Client> {
    const type = findMembershipType(draft.membershipTypeId);
    if (!type) {
      throw new UnknownMembershipTypeError(draft.membershipTypeId);
    }
    return this.#store.save(createClient(toClientId(newId()), draft, type));
  }

  async update(client: Client): Promise<Client> {
    if (!this.#store.has(client.id)) {
      throw new RecordNotFoundError("client", client.id);
    }
    return this.#store.save(client);
  }
}
