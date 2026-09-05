import type { Client, ClientDraft, ClientId } from "@apexg/core";
import { createClient, findMembershipType, toClientId } from "@apexg/core";
import type { ClientRepository } from "../client-repository";
import {
  ClientNotFoundError,
  UnknownMembershipTypeError,
} from "../client-repository";
import { buildSeedClients } from "./client-seed";

/**
 * Keeps clients in memory for the duration of the page.
 *
 * This is the stand-in until the backend exists. It is deliberately the only
 * place that knows the data is not persisted, so replacing it with an HTTP
 * implementation touches no other file.
 */
export class InMemoryClientRepository implements ClientRepository {
  readonly #clients = new Map<ClientId, Client>();

  constructor(initial: readonly Client[] = buildSeedClients()) {
    for (const client of initial) {
      this.#clients.set(client.id, client);
    }
  }

  async list(): Promise<readonly Client[]> {
    return [...this.#clients.values()];
  }

  async findById(id: ClientId): Promise<Client | undefined> {
    return this.#clients.get(id);
  }

  async create(draft: ClientDraft): Promise<Client> {
    const type = findMembershipType(draft.membershipTypeId);
    if (!type) {
      throw new UnknownMembershipTypeError(draft.membershipTypeId);
    }

    const client = createClient(nextId(), draft, type);
    this.#clients.set(client.id, client);
    return client;
  }

  async update(client: Client): Promise<Client> {
    if (!this.#clients.has(client.id)) {
      throw new ClientNotFoundError(client.id);
    }
    this.#clients.set(client.id, client);
    return client;
  }
}

/**
 * Ids come from the data layer, never from a component.
 *
 * `Date.now()` was the previous approach and collides whenever two records are
 * created within the same millisecond.
 */
function nextId(): ClientId {
  return toClientId(globalThis.crypto.randomUUID());
}
