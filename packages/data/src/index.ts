/**
 * `@apexg/data` — data access.
 *
 * Exposes the contracts the application depends on, plus the in-memory
 * implementations used until the backend exists.
 */

export * from "./client-repository";
export { InMemoryClientRepository } from "./in-memory/in-memory-client-repository";
export { buildSeedClients } from "./in-memory/client-seed";
