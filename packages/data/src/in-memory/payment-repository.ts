import type { Payment, PaymentId } from "@apexg/core";
import { toPaymentId } from "@apexg/core";
import type { PaymentRepository } from "../repositories";
import { InMemoryStore, newId } from "./in-memory-store";

/**
 * Append-only, matching the contract.
 *
 * RNF-07 forbids editing financial records retroactively without a trace, so a
 * correction must be a new record, never a rewrite of an old one.
 */
export class InMemoryPaymentRepository implements PaymentRepository {
  readonly #store: InMemoryStore<PaymentId, Payment>;

  constructor(initial: readonly Payment[] = []) {
    this.#store = new InMemoryStore(initial);
  }

  list(): Promise<readonly Payment[]> {
    return this.#store.list();
  }

  async record(draft: Omit<Payment, "id">): Promise<Payment> {
    return this.#store.save({ ...draft, id: toPaymentId(newId()) });
  }

  /** No server behind this one, so there is nothing to open. */
  receiptUrl(): string {
    return "";
  }
}
