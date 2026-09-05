import type { Client, ClientDraft, ClientId } from "@apexg/core";

/**
 * How the application reads and writes clients.
 *
 * Components depend on this contract, never on a concrete source. Swapping the
 * in-memory implementation for the HTTP one requires no UI change.
 *
 * The methods are asynchronous even though today's implementation is not: the
 * eventual backend will be, and designing for it now keeps that swap invisible
 * to callers.
 */
export interface ClientRepository {
  list(): Promise<readonly Client[]>;

  /** Generates the id and derives the expiration date (RF-07). */
  create(draft: ClientDraft): Promise<Client>;

  update(client: Client): Promise<Client>;

  findById(id: ClientId): Promise<Client | undefined>;
}

/** Raised when a write targets a client that no longer exists. */
export class ClientNotFoundError extends Error {
  constructor(readonly clientId: ClientId) {
    super(`No client with id ${clientId}`);
    this.name = "ClientNotFoundError";
  }
}

/** Raised when a client references a membership type that is not in the catalogue. */
export class UnknownMembershipTypeError extends Error {
  constructor(readonly membershipTypeId: string) {
    super(`No membership type with id ${membershipTypeId}`);
    this.name = "UnknownMembershipTypeError";
  }
}
