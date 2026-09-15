import type { Trainer } from "../domain/trainer";
import { createSectionCatalog } from "./section-catalog";

export type TrainerSectionId = "all" | "add" | "available" | "commissions";

/** Sections of the Trainers module (RF-22, RF-23, RF-25). */
export const trainerSections = createSectionCatalog<TrainerSectionId, Trainer>([
  {
    id: "all",
    label: "Todos los entrenadores",
    title: "Todos los entrenadores",
    icon: "list",
    view: { kind: "list", includes: () => true },
  },
  {
    id: "add",
    label: "Agregar entrenador",
    title: "Agregar entrenador",
    icon: "userPlus",
    view: { kind: "form" },
  },
  {
    id: "available",
    label: "Disponibles",
    title: "Entrenadores disponibles",
    icon: "userCheck",
    // Capacity depends on how many clients are assigned, which this predicate
    // cannot see. The module filters on it; here we only exclude inactive staff.
    view: { kind: "list", includes: (trainer) => trainer.active },
  },
  {
    id: "commissions",
    label: "Comisiones",
    title: "Comisiones por entrenador",
    icon: "wallet",
    view: { kind: "panel" },
  },
]);
