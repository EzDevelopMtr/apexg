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

  /**
   * Sin backend no hay dónde guardar el archivo, así que la foto se ignora y
   * solo se recuerda que existe. Basta para desarrollar la pantalla.
   */
  async create(draft: ClientDraft, photo?: Blob): Promise<Client> {
    const type = findMembershipType(draft.membershipTypeId);
    if (!type) {
      throw new UnknownMembershipTypeError(draft.membershipTypeId);
    }
    const created = createClient(toClientId(newId()), draft, type);
    return this.#store.save(
      photo ? { ...created, hasPhoto: true } : created,
    );
  }

  async update(client: Client, photo?: Blob): Promise<Client> {
    if (!this.#store.has(client.id)) {
      throw new RecordNotFoundError("client", client.id);
    }
    return this.#store.save(photo ? { ...client, hasPhoto: true } : client);
  }

  photoUrl(clientId: ClientId): string {
    return `/clients/${clientId}/photo`;
  }

  /** Sin backend no hay periodos: el seed sirve para leer, no para renovar. */
  async renew(): Promise<Client> {
    throw new Error("Renovar una membresía requiere el backend.");
  }
}
