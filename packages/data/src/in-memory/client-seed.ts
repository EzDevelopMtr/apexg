import type { Client, ClientDraft } from "@apexg/core";
import { createClient, findMembershipType, toClientId } from "@apexg/core";

/**
 * Sample clients used while there is no backend.
 *
 * Expiration dates are derived through `createClient` rather than typed in, so
 * the fixtures cannot contradict the membership terms they claim to use.
 */
const DRAFTS: readonly (ClientDraft & { readonly seedId: string })[] = [
  {
    seedId: "seed-1",
    fullName: "Juan Pérez",
    idNumber: "1001234567",
    phone: "3001234567",
    email: "juan@email.com",
    membershipTypeId: "monthly",
    status: "active",
    startDate: "2026-08-15" as ClientDraft["startDate"],
  },
  {
    seedId: "seed-2",
    fullName: "Laura Gómez",
    idNumber: "1007654321",
    phone: "3017654321",
    email: "laura@email.com",
    membershipTypeId: "personalTraining",
    status: "active",
    startDate: "2026-09-01" as ClientDraft["startDate"],
  },
  {
    seedId: "seed-3",
    fullName: "Carlos Rodríguez",
    idNumber: "1012345678",
    phone: "3102345678",
    email: "carlos@email.com",
    membershipTypeId: "monthlyThreeDays",
    status: "active",
    startDate: "2026-08-10" as ClientDraft["startDate"],
  },
  {
    seedId: "seed-4",
    fullName: "Ana Martínez",
    idNumber: "1018765432",
    phone: "3158765432",
    email: "ana@email.com",
    membershipTypeId: "monthly",
    status: "active",
    startDate: "2026-06-20" as ClientDraft["startDate"],
  },
  {
    seedId: "seed-5",
    fullName: "Pedro Sánchez",
    idNumber: "1023456789",
    phone: "3203456789",
    email: "pedro@email.com",
    membershipTypeId: "fortnight",
    status: "active",
    startDate: "2026-09-01" as ClientDraft["startDate"],
  },
  {
    seedId: "seed-6",
    fullName: "Marcela Ruiz",
    idNumber: "1029876543",
    phone: "3119876543",
    email: "marcela@email.com",
    membershipTypeId: "semiPersonal",
    status: "inactive",
    startDate: "2026-05-01" as ClientDraft["startDate"],
  },
];

export function buildSeedClients(): Client[] {
  return DRAFTS.map(({ seedId, ...draft }) => {
    const type = findMembershipType(draft.membershipTypeId);
    if (!type) {
      throw new Error(
        `Seed references unknown plan: ${draft.membershipTypeId}`,
      );
    }
    return createClient(toClientId(seedId), draft, type);
  });
}
