import type { Client, ClientDraft, IsoDate, Trainer } from "@apexg/core";
import {
  createClient,
  findMembershipType,
  fromPesos,
  toClientId,
  toMembershipTypeId,
  toTrainerId,
} from "@apexg/core";

/** Test data used while there is no backend. Not shipped to production. */

const day = (value: string) => value as IsoDate;

export function buildSeedTrainers(): Trainer[] {
  return [
    {
      id: toTrainerId("trainer-1"),
      fullName: "Andrés Quintero",
      idNumber: "1015678234",
      phone: "3116549872",
      certifications: "Certificación en entrenamiento funcional",
      hiredOn: day("2025-02-01"),
      salary: fromPesos(1_800_000),
      maxClients: 15,
      active: true,
    },
    {
      id: toTrainerId("trainer-2"),
      fullName: "Diana Cárdenas",
      idNumber: "1022345987",
      phone: "3204558712",
      certifications: "N/A",
      hiredOn: day("2025-06-15"),
      salary: fromPesos(1_600_000),
      maxClients: 10,
      active: true,
    },
  ];
}

type SeedDraft = Omit<
  ClientDraft,
  "emergencyContactName" | "emergencyContactPhone" | "bloodType" | "medicalCondition" | "comments"
> & { readonly seedId: string };

const CLIENT_DRAFTS: readonly SeedDraft[] = [
  {
    seedId: "client-1",
    fullName: "Juan Pérez",
    idNumber: "1001234567",
    phone: "3001234567",
    email: "juan@email.com",
    membershipTypeId: toMembershipTypeId("monthly"),
    status: "active",
    startDate: day("2026-08-15"),
  },
  {
    seedId: "client-2",
    fullName: "Laura Gómez",
    idNumber: "1007654321",
    phone: "3017654321",
    email: "laura@email.com",
    membershipTypeId: toMembershipTypeId("personalTraining"),
    status: "active",
    startDate: day("2026-09-01"),
    trainerId: toTrainerId("trainer-1"),
  },
  {
    seedId: "client-3",
    fullName: "Carlos Rodríguez",
    idNumber: "1012345678",
    phone: "3102345678",
    email: "carlos@email.com",
    membershipTypeId: toMembershipTypeId("monthlyThreeDays"),
    status: "active",
    startDate: day("2026-08-10"),
  },
  {
    seedId: "client-4",
    fullName: "Ana Martínez",
    idNumber: "1018765432",
    phone: "3158765432",
    email: "ana@email.com",
    membershipTypeId: toMembershipTypeId("monthly"),
    status: "active",
    startDate: day("2026-06-20"),
  },
  {
    seedId: "client-5",
    fullName: "Pedro Sánchez",
    idNumber: "1023456789",
    phone: "3203456789",
    email: "pedro@email.com",
    membershipTypeId: toMembershipTypeId("fortnight"),
    status: "active",
    startDate: day("2026-09-01"),
  },
  {
    seedId: "client-6",
    fullName: "Marcela Ruiz",
    idNumber: "1029876543",
    phone: "3119876543",
    email: "marcela@email.com",
    membershipTypeId: toMembershipTypeId("semiPersonal"),
    status: "inactive",
    startDate: day("2026-05-01"),
    trainerId: toTrainerId("trainer-2"),
  },
];

/**
 * Expiration dates are derived through `createClient` rather than typed in, so
 * the fixtures cannot contradict the membership terms they claim to use.
 */
export function buildSeedClients(): Client[] {
  return CLIENT_DRAFTS.map(({ seedId, ...draft }) => {
    const type = findMembershipType(draft.membershipTypeId);
    if (!type) {
      throw new Error(
        `Seed references unknown plan: ${draft.membershipTypeId}`,
      );
    }
    return createClient(
      toClientId(seedId),
      {
        ...draft,
        emergencyContactName: "",
        emergencyContactPhone: "",
        bloodType: "",
        medicalCondition: "",
        comments: "",
      },
      type,
    );
  });
}
