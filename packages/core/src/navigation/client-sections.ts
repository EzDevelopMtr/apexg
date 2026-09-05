import type { IsoDate } from "../domain/calendar";
import type { Client } from "../domain/client";
import { isExpiringSoon, resolveStatus } from "../domain/client";
import type { IconName } from "./icons";

/** Segment used in the URL, e.g. `/modules/clients/active`. */
export type ClientSectionId = "all" | "add" | "active" | "expiring" | "overdue";

/** Decides whether a client belongs in a list section. */
export type ClientPredicate = (
  client: Client,
  referenceDate: IsoDate,
) => boolean;

/**
 * What a section renders. Modelled as a discriminated union because "add" is a
 * form, not a filtered list — the previous design mixed both into one string
 * and forced an `if` branch inside the component.
 */
export type ClientSectionView =
  | { readonly kind: "list"; readonly includes: ClientPredicate }
  | { readonly kind: "form" };

export interface ClientSection {
  readonly id: ClientSectionId;
  /** Sidebar label, in Spanish. */
  readonly label: string;
  /** Page heading, in Spanish. */
  readonly title: string;
  readonly icon: IconName;
  readonly view: ClientSectionView;
}

/**
 * Client sections, each carrying its own predicate.
 *
 * Adding a section — "inactive", say — means appending a record here. No
 * component changes, no conditional to extend.
 */
export const CLIENT_SECTIONS: readonly ClientSection[] = [
  {
    id: "all",
    label: "Todos los clientes",
    title: "Todos los clientes",
    icon: "list",
    view: { kind: "list", includes: () => true },
  },
  {
    id: "add",
    label: "Agregar cliente",
    title: "Agregar cliente",
    icon: "userPlus",
    view: { kind: "form" },
  },
  {
    id: "active",
    label: "Clientes activos",
    title: "Clientes activos",
    icon: "userCheck",
    view: {
      kind: "list",
      includes: (client, on) => resolveStatus(client, on) === "active",
    },
  },
  {
    id: "expiring",
    label: "Por vencer",
    title: "Clientes por vencer",
    icon: "clock",
    view: { kind: "list", includes: isExpiringSoon },
  },
  {
    id: "overdue",
    label: "En mora",
    title: "Clientes en mora",
    icon: "userX",
    view: {
      kind: "list",
      includes: (client, on) => resolveStatus(client, on) === "overdue",
    },
  },
];

const BY_ID = new Map<ClientSectionId, ClientSection>(
  CLIENT_SECTIONS.map((section) => [section.id, section]),
);

export const DEFAULT_CLIENT_SECTION: ClientSectionId = "all";

/**
 * Narrows a URL segment to a known section.
 *
 * A type guard rather than a boolean, so callers get a typed `ClientSectionId`
 * and the compiler rules out unhandled sections.
 */
export function isClientSectionId(value: string): value is ClientSectionId {
  return BY_ID.has(value as ClientSectionId);
}

/**
 * Resolves a section by id.
 *
 * Total by construction: `ClientSectionId` is the union of the ids in
 * `CLIENT_SECTIONS`, which is what `BY_ID` is built from. The throw guards
 * against the table and the type drifting apart.
 *
 * Sections carry predicates, and functions cannot cross a server/client
 * boundary — pass the id across and resolve it on the client.
 */
export function getClientSection(id: ClientSectionId): ClientSection {
  const section = BY_ID.get(id);
  if (!section) {
    throw new Error(`Unknown client section: ${id}`);
  }
  return section;
}
