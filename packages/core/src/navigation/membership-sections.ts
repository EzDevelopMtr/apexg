import type { MembershipType } from "../domain/membership";
import { createSectionCatalog } from "./section-catalog";

export type MembershipSectionId = "all" | "add" | "promotions";

/** Sections of the Memberships module (RF-12, RF-13). */
export const membershipSections = createSectionCatalog<
  MembershipSectionId,
  MembershipType
>([
  {
    id: "all",
    label: "Todos los planes",
    title: "Tipos de membresía",
    icon: "list",
    view: { kind: "list", includes: () => true },
  },
  {
    id: "add",
    label: "Crear plan",
    title: "Crear tipo de membresía",
    icon: "userPlus",
    view: { kind: "form" },
  },
  {
    id: "promotions",
    label: "Promociones",
    title: "Promociones",
    icon: "card",
    view: { kind: "list", includes: (type) => type.isPromotional },
  },
]);
