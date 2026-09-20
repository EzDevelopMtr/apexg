import type { MembershipType, MembershipTypeId } from "./membership";
import { toMembershipTypeId } from "./membership";
import { fromPesos } from "./money";

/**
 * The default membership catalogue (RF-13), transcribed from SRS §4.1.
 *
 * This is seed data, not the catalogue: RF-12 lets the administrator create,
 * edit and delete types, and the real backend does exactly that against a
 * table of its own, arbitrary UUIDs and all. `packages/data/src/in-memory/`
 * uses this array (and `findMembershipType`/`isMembershipTypeId` below) to
 * back the in-memory `MembershipTypeRepository` — nothing that talks to the
 * real backend should import it; ask `MembershipTypeRepository.list()`
 * (via `@apexg/module-kit`'s `useMembershipTypeCatalog`) for the live one.
 *
 * The personal and semi-personal plans' term is not in §4.1 itself;
 * confirmed monthly, matching every other recurring plan in this catalogue.
 */
export const DEFAULT_MEMBERSHIP_TYPES: readonly MembershipType[] = [
  {
    id: toMembershipTypeId("monthly"),
    name: "Mensualidad (lunes a sábado)",
    price: fromPesos(65_000),
    term: { unit: "month", amount: 1 },
    minimumInstallment: fromPesos(30_000),
    isPromotional: false,
    trainerSplit: null,
    weeklyVisits: 6,
    conditions: "Acceso de lunes a sábado, vigencia de 1 mes.",
  },
  {
    id: toMembershipTypeId("monthlyThreeDays"),
    name: "Mes 3 veces por semana",
    price: fromPesos(50_000),
    term: { unit: "month", amount: 1 },
    minimumInstallment: fromPesos(30_000),
    isPromotional: false,
    trainerSplit: null,
    weeklyVisits: 3,
    conditions: "3 días a la semana, organizables libremente durante 1 mes.",
  },
  {
    id: toMembershipTypeId("fortnight"),
    name: "Quincena",
    price: fromPesos(45_000),
    term: { unit: "day", amount: 15 },
    minimumInstallment: null,
    isPromotional: false,
    trainerSplit: null,
    weeklyVisits: null,
    conditions: "Vigencia de 15 días calendario desde la fecha de inicio.",
  },
  {
    id: toMembershipTypeId("week"),
    name: "Semana",
    price: fromPesos(25_000),
    term: { unit: "day", amount: 7 },
    minimumInstallment: null,
    isPromotional: false,
    trainerSplit: null,
    weeklyVisits: null,
    conditions: "Vigencia de 7 días.",
  },
  {
    id: toMembershipTypeId("day"),
    name: "Día",
    price: fromPesos(6_000),
    term: { unit: "day", amount: 1 },
    minimumInstallment: null,
    isPromotional: false,
    trainerSplit: null,
    weeklyVisits: null,
    conditions: "Vigencia de 1 día.",
  },
  {
    // RF-14 vs. §4.1 se contradecían ("el mismo día" vs. "un lapso de 3
    // días"); resuelto a favor de §4.1 (más flexible). Sin validación
    // automática todavía — la recepcionista aplica el criterio al vender
    // el plan, igual que antes de resolver la contradicción.
    id: toMembershipTypeId("friendsPromo"),
    name: "Promo amigos/familiar",
    price: fromPesos(60_000),
    term: { unit: "month", amount: 1 },
    minimumInstallment: null,
    isPromotional: true,
    trainerSplit: null,
    weeklyVisits: null,
    conditions:
      "Aplica cuando 3 o más clientes pagan su mensualidad dentro de un lapso de 3 días.",
  },
  {
    id: toMembershipTypeId("flyerPromo"),
    name: "Promo folleto físico",
    price: fromPesos(55_000),
    term: { unit: "month", amount: 1 },
    minimumInstallment: null,
    isPromotional: true,
    trainerSplit: null,
    weeklyVisits: null,
    conditions:
      "Solo para clientes nuevos que presenten el folleto al inscribirse.",
  },
  {
    id: toMembershipTypeId("personalTraining"),
    name: "Personalizado",
    price: fromPesos(200_000),
    term: { unit: "month", amount: 1 },
    minimumInstallment: fromPesos(100_000),
    isPromotional: false,
    trainerSplit: { trainer: fromPesos(100_000), business: fromPesos(100_000) },
    weeklyVisits: null,
    conditions: "Entrenamiento personalizado 1 a 1.",
  },
  {
    id: toMembershipTypeId("semiPersonal"),
    name: "Semipersonalizado",
    price: fromPesos(150_000),
    term: { unit: "month", amount: 1 },
    minimumInstallment: fromPesos(75_000),
    isPromotional: false,
    trainerSplit: { trainer: fromPesos(75_000), business: fromPesos(75_000) },
    weeklyVisits: null,
    conditions: "Entrenamiento semipersonalizado.",
  },
];

const BY_ID = new Map<MembershipTypeId, MembershipType>(
  DEFAULT_MEMBERSHIP_TYPES.map((type) => [type.id, type]),
);

/** Looks up a plan in the SEED catalogue above — see its own doc comment. */
export function findMembershipType(
  id: MembershipTypeId,
): MembershipType | undefined {
  return BY_ID.get(id);
}

/** Whether `value` is one of the nine seed plans above. */
export function isMembershipTypeId(value: string): value is MembershipTypeId {
  return BY_ID.has(value as MembershipTypeId);
}
