import type { Repositories } from "../repositories";
import {
  InMemoryClientRepository,
  InMemoryDailyLogRepository,
  InMemoryExpenseRepository,
  InMemoryInventoryRepository,
  InMemoryPaymentRepository,
  InMemoryTrainerRepository,
} from "../in-memory";
import { HttpMembershipTypeRepository } from "./http-membership-type-repository";

/**
 * Builds the repository set backed by the real backend.
 *
 * Filled in one module at a time (see the project's own memory of this
 * effort) — a repository not yet converted stays in-memory here, clearly
 * marked, rather than silently working against fixture data.
 */
export function createHttpRepositories(): Repositories {
  return {
    clients: new InMemoryClientRepository(), // TODO(http): not yet connected
    membershipTypes: new HttpMembershipTypeRepository(),
    payments: new InMemoryPaymentRepository(), // TODO(http): not yet connected
    trainers: new InMemoryTrainerRepository(), // TODO(http): not yet connected
    expenses: new InMemoryExpenseRepository(), // TODO(http): not yet connected
    inventory: new InMemoryInventoryRepository(), // TODO(http): not yet connected
    dailyLog: new InMemoryDailyLogRepository(), // TODO(http): not yet connected
  };
}

export { HttpMembershipTypeRepository } from "./http-membership-type-repository";
export { ApiError, apiFetch } from "./http-client";
export type { ApiRequestOptions } from "./http-client";
