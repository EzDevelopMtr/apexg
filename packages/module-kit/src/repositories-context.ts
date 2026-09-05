import { createContext } from "react";
import type { Repositories } from "@apexg/data";

/**
 * Carries the repositories every module reads and writes through.
 *
 * Modules depend on the contracts in `@apexg/data`, never on a concrete
 * source, so the app decides whether those are the in-memory stand-ins or the
 * eventual HTTP clients without any module changing.
 */
export const RepositoriesContext = createContext<Repositories | null>(null);
