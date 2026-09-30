import type { DayPass, DayPassId } from "@apexg/core";
import { toDayPassId, today } from "@apexg/core";
import type { DayPassRepository, DayPassSale } from "../repositories";
import { InMemoryStore, newId } from "./in-memory-store";

/** Append-only, charged at the amount typed at the counter like the real API. */
export class InMemoryDayPassRepository implements DayPassRepository {
  readonly #store: InMemoryStore<DayPassId, DayPass>;

  constructor(initial: readonly DayPass[] = []) {
    this.#store = new InMemoryStore(initial);
  }

  list(): Promise<readonly DayPass[]> {
    return this.#store.list();
  }

  async sell(sale: DayPassSale, receipt?: Blob): Promise<DayPass> {
    const now = new Date();
    return this.#store.save({
      id: toDayPassId(newId()),
      visitorName: sale.visitorName.trim(),
      amount: sale.amount,
      paymentMethod: sale.paymentMethod,
      soldOn: today(),
      soldAt: now.toTimeString().slice(0, 5),
      receiptPath: receipt ? "comprobante" : "",
      recordedBy: "Recepción",
    });
  }

  /** No server behind this one, so there is nothing to open. */
  receiptUrl(): string {
    return "";
  }
}
