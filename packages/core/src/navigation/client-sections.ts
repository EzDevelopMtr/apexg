import type { Client } from "../domain/client";
import { isExpiringSoon, resolveStatus } from "../domain/client";
import { createSectionCatalog } from "./section-catalog";
import type { ModuleSection } from "./section-catalog";

export type ClientSectionId = "all" | "add" | "active" | "expiring" | "overdue";

export type ClientSection = ModuleSection<ClientSectionId, Client>;

/**
 * Client sections, each carrying its own predicate.
 *
 * Adding a section — "inactive", say — means appending a record here. No
 * component changes, no conditional to extend.
 */
export const clientSections = createSectionCatalog<ClientSectionId, Client>([
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
]);

export const CLIENT_SECTIONS = clientSections.sections;
export const DEFAULT_CLIENT_SECTION = clientSections.defaultSectionId;

/**
 * Narrows a URL segment to a known section.
 *
 * Sections carry predicates, and functions cannot cross a server/client
 * boundary — pass the id across and resolve it on the client.
 */
export const isClientSectionId = clientSections.isSectionId;
export const getClientSection = clientSections.getSection;
