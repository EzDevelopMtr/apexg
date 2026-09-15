import type { Repositories } from "../repositories";
import { HttpClientRepository } from "./http-client-repository";
import { HttpDailyLogRepository } from "./http-daily-log-repository";
import { HttpExpenseRepository } from "./http-expense-repository";
import { HttpInventoryRepository } from "./http-inventory-repository";
import { HttpMembershipTypeRepository } from "./http-membership-type-repository";
import { HttpPaymentRepository } from "./http-payment-repository";
import { HttpTrainerRepository } from "./http-trainer-repository";

/** Builds the full repository set backed by the real backend. */
export function createHttpRepositories(): Repositories {
  return {
    clients: new HttpClientRepository(),
    membershipTypes: new HttpMembershipTypeRepository(),
    payments: new HttpPaymentRepository(),
    trainers: new HttpTrainerRepository(),
    expenses: new HttpExpenseRepository(),
    inventory: new HttpInventoryRepository(),
    dailyLog: new HttpDailyLogRepository(),
  };
}

export { HttpClientRepository } from "./http-client-repository";
export { HttpDailyLogRepository } from "./http-daily-log-repository";
export { HttpExpenseRepository } from "./http-expense-repository";
export { HttpInventoryRepository } from "./http-inventory-repository";
export { HttpMembershipTypeRepository } from "./http-membership-type-repository";
export { HttpPaymentRepository } from "./http-payment-repository";
export { HttpTrainerRepository } from "./http-trainer-repository";
export { ApiError, apiFetch } from "./http-client";
export type { ApiRequestOptions } from "./http-client";
