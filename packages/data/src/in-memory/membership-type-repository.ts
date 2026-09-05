import type { MembershipType, MembershipTypeId } from "@apexg/core";
import { DEFAULT_MEMBERSHIP_TYPES } from "@apexg/core";
import type { MembershipTypeRepository } from "../repositories";
import { InMemoryStore } from "./in-memory-store";

export class InMemoryMembershipTypeRepository implements MembershipTypeRepository {
  readonly #store: InMemoryStore<MembershipTypeId, MembershipType>;

  constructor(initial: readonly MembershipType[] = DEFAULT_MEMBERSHIP_TYPES) {
    this.#store = new InMemoryStore(initial);
  }

  list(): Promise<readonly MembershipType[]> {
    return this.#store.list();
  }

  findById(id: MembershipTypeId): Promise<MembershipType | undefined> {
    return this.#store.findById(id);
  }

  save(type: MembershipType): Promise<MembershipType> {
    return this.#store.save(type);
  }

  remove(id: MembershipTypeId): Promise<void> {
    return this.#store.remove(id);
  }
}
