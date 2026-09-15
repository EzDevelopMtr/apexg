import type { Repositories } from "../repositories";
import { InMemoryClientRepository } from "./client-repository";
import { InMemoryDailyLogRepository } from "./daily-log-repository";
import { InMemoryExpenseRepository } from "./expense-repository";
import { InMemoryInventoryRepository } from "./inventory-repository";
import { InMemoryMembershipTypeRepository } from "./membership-type-repository";
import { InMemoryPaymentRepository } from "./payment-repository";
import { InMemoryTrainerRepository } from "./trainer-repository";
import {
  buildSeedClients,
  buildSeedCommissions,
  buildSeedExpenses,
  buildSeedInventory,
  buildSeedPayments,
  buildSeedTrainers,
} from "./seed";

/**
 * Builds the whole set of repositories, wired to seed data.
 *
 * One factory rather than seven constructor calls scattered across the app:
 * when the backend arrives, this is the single place that swaps.
 */
export function createInMemoryRepositories(): Repositories {
  return {
    clients: new InMemoryClientRepository(buildSeedClients()),
    membershipTypes: new InMemoryMembershipTypeRepository(),
    payments: new InMemoryPaymentRepository(buildSeedPayments()),
    trainers: new InMemoryTrainerRepository(
      buildSeedTrainers(),
      buildSeedCommissions(),
    ),
    expenses: new InMemoryExpenseRepository(buildSeedExpenses()),
    inventory: new InMemoryInventoryRepository(buildSeedInventory()),
    dailyLog: new InMemoryDailyLogRepository(),
  };
}

export { InMemoryClientRepository } from "./client-repository";
export { InMemoryDailyLogRepository } from "./daily-log-repository";
export { InMemoryExpenseRepository } from "./expense-repository";
export { InMemoryInventoryRepository } from "./inventory-repository";
export { InMemoryMembershipTypeRepository } from "./membership-type-repository";
export { InMemoryPaymentRepository } from "./payment-repository";
export { InMemoryTrainerRepository } from "./trainer-repository";
export { InMemoryStore, newId } from "./in-memory-store";
export * from "./seed";
