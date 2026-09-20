import type { MembershipType, MembershipTypeId } from "@apexg/core";
import { fromPesos } from "@apexg/core";

/** A blank plan, for the "create" flow (RF-12). */
export function emptyMembershipType(): MembershipType {
  return {
    id: "" as MembershipTypeId,
    name: "",
    price: fromPesos(0),
    term: { unit: "month", amount: 1 },
    minimumInstallment: null,
    isPromotional: false,
    trainerSplit: null,
    weeklyVisits: 6,
    conditions: "",
  };
}
