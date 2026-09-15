import type { Client, ClientDraft, ClientId, ClientStatus, IsoDate } from "@apexg/core";
import { toClientId, toMembershipTypeId, toTrainerId } from "@apexg/core";
import type { ClientRepository } from "../repositories";
import { RecordNotFoundError } from "../repositories";
import { ApiError, apiFetch } from "./http-client";

type ApiClientState = 1 | 2 | 3;

interface ApiMembershipSummary {
  id: string;
  membershipTypeId: string;
  membershipTypeName: string;
  trainerId: string | null;
  startDate: string;
  endDate: string;
  agreedPrice: string;
}

interface ApiClientResult {
  id: string;
  documentNumber: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  state: ApiClientState;
  currentMembership: ApiMembershipSummary | null;
}

const STATE_TO_STATUS: Record<ApiClientState, ClientStatus> = {
  1: "active",
  2: "inactive",
  3: "overdue",
};

/**
 * The backend also carries `emergencyContact*`, `bloodType`, `birthDate`,
 * `medicalCondition` and `comments` (see `ClientResult`) — this frontend's
 * `Client` does not model any of those yet (ERS fields with no screen), so
 * they round-trip as `null` rather than being surfaced or lost silently.
 * Documented in the project's own memory, not decided here.
 */
function fromResult(row: ApiClientResult): Client {
  const membership = row.currentMembership;
  if (!membership) {
    // `ClientsService.create` always inserts the client and its first
    // membership in one transaction — a null here means corrupt data, not
    // a state the UI has any legitimate way to render.
    throw new Error(`El cliente ${row.id} no tiene una membresía asociada.`);
  }

  return {
    id: toClientId(row.id),
    fullName: row.fullName,
    idNumber: row.documentNumber,
    phone: row.phone ?? "",
    email: row.email ?? "",
    membershipTypeId: toMembershipTypeId(membership.membershipTypeId),
    status: STATE_TO_STATUS[row.state],
    startDate: membership.startDate as IsoDate,
    expirationDate: membership.endDate as IsoDate,
    trainerId: membership.trainerId === null ? undefined : toTrainerId(membership.trainerId),
  };
}

function toCreateBody(draft: ClientDraft): Record<string, unknown> {
  return {
    documentNumber: draft.idNumber,
    fullName: draft.fullName,
    phone: draft.phone,
    // `@IsEmail()` on the backend rejects `""` outright — an empty string
    // must travel as "field absent", not as an invalid email.
    email: draft.email.trim() === "" ? undefined : draft.email,
    membershipTypeId: draft.membershipTypeId,
    startDate: draft.startDate,
    trainerId: draft.trainerId,
  };
}

/** Only the personal-data fields `PATCH /clients/:id` accepts (`UpdateClientDto`). */
function toUpdateBody(client: Client): Record<string, unknown> {
  return {
    fullName: client.fullName,
    phone: client.phone,
    email: client.email.trim() === "" ? undefined : client.email,
  };
}

const UNSUPPORTED_EDIT_MESSAGE =
  "No se puede cambiar el tipo de membresía, la fecha de inicio ni el entrenador desde este formulario todavía.";

const UNSUPPORTED_STATUS_MESSAGE =
  "El estado del cliente se deriva automáticamente; desde aquí solo se puede retirar un cliente.";

export class HttpClientRepository implements ClientRepository {
  async list(): Promise<readonly Client[]> {
    const rows = await apiFetch<ApiClientResult[]>("/clients");
    return rows.map(fromResult);
  }

  async findById(id: ClientId): Promise<Client | undefined> {
    try {
      const row = await apiFetch<ApiClientResult>(`/clients/${id}`);
      return fromResult(row);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return undefined;
      }
      throw error;
    }
  }

  async create(draft: ClientDraft): Promise<Client> {
    const row = await apiFetch<ApiClientResult>("/clients", {
      method: "POST",
      body: toCreateBody(draft),
    });
    return fromResult(row);
  }

  /**
   * `PATCH /clients/:id` only ever accepts personal data (RF-05) — plan,
   * fecha de inicio, entrenador and estado are not editable fields on the
   * backend (retiring is its own endpoint, SRS §4.5; the rest simply is not
   * supported yet). The edit form still lets staff touch all of those, so
   * this rejects a real attempt to change them rather than silently saving
   * only the personal-data half and reporting success.
   */
  async update(client: Client): Promise<Client> {
    const current = await this.findById(client.id);
    if (!current) {
      throw new RecordNotFoundError("client", client.id);
    }

    if (
      client.membershipTypeId !== current.membershipTypeId ||
      client.startDate !== current.startDate ||
      client.trainerId !== current.trainerId
    ) {
      throw new Error(UNSUPPORTED_EDIT_MESSAGE);
    }

    if (client.status !== current.status) {
      if (client.status !== "inactive") {
        throw new Error(UNSUPPORTED_STATUS_MESSAGE);
      }
      const retired = await apiFetch<ApiClientResult>(`/clients/${client.id}/retire`, {
        method: "POST",
      });
      return fromResult(retired);
    }

    const row = await apiFetch<ApiClientResult>(`/clients/${client.id}`, {
      method: "PATCH",
      body: toUpdateBody(client),
    });
    return fromResult(row);
  }
}
