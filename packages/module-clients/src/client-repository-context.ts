import { createContext } from "react";
import type { ClientRepository } from "@apexg/data";

/**
 * Carries the repository the module reads and writes through.
 *
 * The module depends on the `ClientRepository` contract, never on a concrete
 * source, so the app decides whether that is the in-memory stand-in or the
 * eventual HTTP client without this package changing.
 */
export const ClientRepositoryContext = createContext<ClientRepository | null>(
  null,
);
