import type { DayPass, DayPassId, MembershipType } from "@apexg/core";
import { dayPassPlan, toDayPassId, today } from "@apexg/core";
import type { DayPassRepository, DayPassSale } from "../repositories";
import { InMemoryStore, newId } from "./in-memory-store";

/** Append-only, and priced from the catalogue like the real API. */
export class InMemoryDayPassRepository implements DayPassRepository {
  readonly #store: InMemoryStore<DayPassId, DayPass>;
  readonly #plans: readonly MembershipType[];

  constructor(plans: readonly MembershipType[], initial: readonly DayPass[] = []) {
    this.#store = new InMemoryStore(initial);
    this.#plans = plans;
  }

  list(): Promise<readonly DayPass[]> {
    return this.#store.list();
  }

  async sell(sale: DayPassSale, receipt?: Blob): Promise<DayPass> {
    const plan = dayPassPlan(this.#plans);
    if (!plan) throw new Error("No hay un plan de un día en el catálogo.");
    const now = new Date();
    return this.#store.save({
      id: toDayPassId(newId()),
      membershipTypeId: plan.id,
      visitorName: sale.visitorName.trim(),
      visitorContact: sale.visitorContact.trim(),
      amount: plan.price,
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
