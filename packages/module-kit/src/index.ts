/**
 * `@apexg/module-kit` — shared plumbing for the business modules.
 *
 * Holds what every module needs and no module should own: access to the
 * repositories and the load/error/reload behaviour around a collection.
 * Presentational pieces live in `@apexg/ui`; business rules live in
 * `@apexg/core`.
 */

export { RepositoriesContext } from "./repositories-context";
export { RepositoriesProvider } from "./repositories-provider";
export { useRepositories } from "./hooks/use-repositories";
export { useCollection, upsertById } from "./hooks/use-collection";
export type { Collection, LoadState } from "./hooks/use-collection";
export { useMembershipTypeCatalog } from "./hooks/use-membership-type-catalog";
export { useGymSettings } from "./hooks/use-gym-settings";
export { useModulePulse } from "./hooks/use-module-pulse";
export type { UseModulePulseResult } from "./hooks/use-module-pulse";

export {
  CollectionGate,
  LoadingState,
  ErrorState,
} from "./components/collection-state";
