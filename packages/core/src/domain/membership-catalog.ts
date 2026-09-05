import type { MembershipType, MembershipTypeId } from "./membership";
import { fromPesos } from "./money";

/**
 * The default membership catalogue (RF-13), transcribed from SRS §4.1.
 *
 * This is seed data, not a hardcoded rule: RF-12 lets the administrator create,
 * edit and delete types, so once persistence exists this table only supplies
 * the initial rows.
 *
 * OPEN QUESTION: §4.1 does not state the term of the personal and
 * semi-personal plans. They are assumed monthly here; confirm with the client.
 */
export const DEFAULT_MEMBERSHIP_TYPES: readonly MembershipType[] = [
  {
    id: "monthly",
    name: "Mensualidad (lunes a sábado)",
    price: fromPesos(65_000),
    term: { unit: "month", amount: 1 },
    minimumInstallment: fromPesos(30_000),
    isPromotional: false,
    trainerSplit: null,
    conditions: "Acceso de lunes a sábado, vigencia de 1 mes.",
  },
  {
    id: "monthlyThreeDays",
    name: "Mes 3 veces por semana",
    price: fromPesos(50_000),
    term: { unit: "month", amount: 1 },
    minimumInstallment: fromPesos(30_000),
    isPromotional: false,
    trainerSplit: null,
    conditions: "3 días a la semana, organizables libremente durante 1 mes.",
  },
  {
    id: "fortnight",
    name: "Quincena",
    price: fromPesos(45_000),
    term: { unit: "day", amount: 15 },
    minimumInstallment: null,
    isPromotional: false,
    trainerSplit: null,
    conditions: "Vigencia de 15 días calendario desde la fecha de inicio.",
  },
  {
    id: "week",
    name: "Semana",
    price: fromPesos(25_000),
    term: { unit: "day", amount: 7 },
    minimumInstallment: null,
    isPromotional: false,
    trainerSplit: null,
    conditions: "Vigencia de 7 días.",
  },
  {
    id: "day",
    name: "Día",
    price: fromPesos(6_000),
    term: { unit: "day", amount: 1 },
    minimumInstallment: null,
    isPromotional: false,
    trainerSplit: null,
    conditions: "Vigencia de 1 día.",
  },
  {
    id: "friendsPromo",
    name: "Promo amigos/familiar",
    price: fromPesos(60_000),
    term: { unit: "month", amount: 1 },
    minimumInstallment: null,
    isPromotional: true,
    trainerSplit: null,
    conditions:
      "Aplica cuando 3 o más clientes pagan su mensualidad en conjunto.",
  },
  {
    id: "flyerPromo",
    name: "Promo folleto físico",
    price: fromPesos(55_000),
    term: { unit: "month", amount: 1 },
    minimumInstallment: null,
    isPromotional: true,
    trainerSplit: null,
    conditions:
      "Solo para clientes nuevos que presenten el folleto al inscribirse.",
  },
  {
    id: "personalTraining",
    name: "Personalizado",
    price: fromPesos(200_000),
    term: { unit: "month", amount: 1 },
    minimumInstallment: fromPesos(100_000),
    isPromotional: false,
    trainerSplit: { trainer: fromPesos(100_000), business: fromPesos(100_000) },
    conditions: "Entrenamiento personalizado 1 a 1.",
  },
  {
    id: "semiPersonal",
    name: "Semipersonalizado",
    price: fromPesos(150_000),
    term: { unit: "month", amount: 1 },
    minimumInstallment: fromPesos(75_000),
    isPromotional: false,
    trainerSplit: { trainer: fromPesos(75_000), business: fromPesos(75_000) },
    conditions: "Entrenamiento semipersonalizado.",
  },
];

const BY_ID = new Map<MembershipTypeId, MembershipType>(
  DEFAULT_MEMBERSHIP_TYPES.map((type) => [type.id, type]),
);

/** Looks up a membership type, or `undefined` if the id is unknown. */
export function findMembershipType(
  id: MembershipTypeId,
): MembershipType | undefined {
  return BY_ID.get(id);
}

/** Narrows a string to a known {@link MembershipTypeId}. */
export function isMembershipTypeId(value: string): value is MembershipTypeId {
  return BY_ID.has(value as MembershipTypeId);
}
