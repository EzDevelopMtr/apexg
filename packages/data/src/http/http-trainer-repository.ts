import type {
  Commission,
  IsoDate,
  PaymentMethod,
  Trainer,
  TrainerId,
} from "@apexg/core";
import {
  fromApiString,
  fromPesos,
  isPaymentMethod,
  toApiString,
  toClientId,
  toPaymentId,
  toTrainerId,
} from "@apexg/core";
import type { TrainerRepository } from "../repositories";
import { RecordNotFoundError } from "../repositories";
import { API_BASE, ApiError, apiFetch } from "./http-client";
import { toFormData } from "./multipart";

type ApiTrainerState = 1 | 2;

/**
 * `GET /trainers` and `GET /trainers/:id` return one of two shapes depending
 * on the caller's permissions: `entrenadores.update` sees every field,
 * `entrenadores.read` alone gets the picker projection — `documentNumber`,
 * `phone`, `hiredAt` and `salary` are simply absent from the JSON, not `null`
 * (see `TrainersService.toPickerResult`).
 */
interface ApiTrainerResult {
  id: string;
  fullName: string;
  state: ApiTrainerState;
  maxClients: number | null;
  assignedClientCount: number;
  documentNumber?: string;
  phone?: string | null;
  hiredAt?: string | null;
  salary?: string | null;
  certifications?: string | null;
}

interface ApiCommissionRecord {
  id: string;
  clientId: string;
  paymentId: string;
  trainerAmount: string;
  commissionDate: string;
  settled: boolean;
  settlementMethod: string | null;
  settlementReceiptPath: string | null;
}

const NO_CERTIFICATIONS = "N/A";

function toCertificationsBody(certifications: string): string | null {
  return certifications.trim().toUpperCase() === NO_CERTIFICATIONS
    ? null
    : certifications;
}

function fromResult(row: ApiTrainerResult): Trainer {
  if (
    row.documentNumber === undefined ||
    row.phone === undefined ||
    row.hiredAt === undefined ||
    row.salary === undefined ||
    row.certifications === undefined
  ) {
    // Proyección de Recepcionista (sin `entrenadores.update`): el seed de
    // permisos exige ocultar justo estos campos, así que no hay forma
    // honesta de completar un `Trainer` — mejor un error claro que salario
    // o documento inventados.
    throw new Error(
      "Este usuario no tiene permiso para ver los datos completos de entrenadores.",
    );
  }

  return {
    id: toTrainerId(row.id),
    fullName: row.fullName,
    idNumber: row.documentNumber,
    phone: row.phone ?? "",
    certifications: row.certifications ?? NO_CERTIFICATIONS,
    hiredOn: (row.hiredAt ?? "") as IsoDate,
    salary: row.salary === null ? fromPesos(0) : fromApiString(row.salary),
    maxClients: row.maxClients ?? 0,
    active: row.state === 1,
  };
}

function fromCommissionResult(
  trainerId: TrainerId,
  row: ApiCommissionRecord,
): Commission {
  return {
    id: row.id,
    trainerId,
    paymentId: toPaymentId(row.paymentId),
    clientId: toClientId(row.clientId),
    amount: fromApiString(row.trainerAmount),
    earnedOn: row.commissionDate as IsoDate,
    settled: row.settled,
    settlementMethod:
      row.settlementMethod !== null && isPaymentMethod(row.settlementMethod)
        ? row.settlementMethod
        : null,
    settlementReceiptPath: row.settlementReceiptPath ?? "",
  };
}

function toCreateBody(draft: Omit<Trainer, "id">): Record<string, unknown> {
  return {
    fullName: draft.fullName,
    documentNumber: draft.idNumber,
    phone: draft.phone,
    hiredAt: draft.hiredOn,
    salary: toApiString(draft.salary),
    maxClients: draft.maxClients,
    certifications: toCertificationsBody(draft.certifications),
  };
}

/** `documentNumber` is not part of `UpdateTrainerDto` — an id does not change by PATCH. */
function toUpdateBody(trainer: Trainer): Record<string, unknown> {
  return {
    fullName: trainer.fullName,
    phone: trainer.phone,
    hiredAt: trainer.hiredOn,
    salary: toApiString(trainer.salary),
    maxClients: trainer.maxClients,
    state: trainer.active ? 1 : 2,
    certifications: toCertificationsBody(trainer.certifications),
  };
}

export class HttpTrainerRepository implements TrainerRepository {
  async list(): Promise<readonly Trainer[]> {
    const rows = await apiFetch<ApiTrainerResult[]>("/trainers");
    return rows.map(fromResult);
  }

  async findById(id: TrainerId): Promise<Trainer | undefined> {
    try {
      const row = await apiFetch<ApiTrainerResult>(`/trainers/${id}`);
      return fromResult(row);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return undefined;
      }
      throw error;
    }
  }

  async create(draft: Omit<Trainer, "id">): Promise<Trainer> {
    const row = await apiFetch<ApiTrainerResult>("/trainers", {
      method: "POST",
      body: toCreateBody(draft),
    });
    return fromResult(row);
  }

  async update(trainer: Trainer): Promise<Trainer> {
    try {
      const row = await apiFetch<ApiTrainerResult>(`/trainers/${trainer.id}`, {
        method: "PATCH",
        body: toUpdateBody(trainer),
      });
      return fromResult(row);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        throw new RecordNotFoundError("trainer", trainer.id);
      }
      throw error;
    }
  }

  /**
   * No bulk endpoint exists — only `GET /trainers/:id/commissions` — so this
   * fans out over every trainer id. `entrenadores.read` (both roles have it)
   * is enough for this route; querying ids directly (not through `list()`)
   * keeps a Recepcionista's restricted trainer projection from blocking it.
   */
  async listCommissions(): Promise<readonly Commission[]> {
    const trainerRows = await apiFetch<{ id: string }[]>("/trainers");
    const perTrainer = await Promise.all(
      trainerRows.map(async (row) => {
        const trainerId = toTrainerId(row.id);
        const commissions = await apiFetch<ApiCommissionRecord[]>(
          `/trainers/${row.id}/commissions`,
        );
        return commissions.map((commission) =>
          fromCommissionResult(trainerId, commission),
        );
      }),
    );
    return perTrainer.flat();
  }

  /**
   * One payout, one receipt: every id travels in the same request so the
   * backend settles them in one transaction. Ids go as a JSON string because
   * multipart has no arrays.
   */
  async settleCommissions(
    trainerId: TrainerId,
    commissionIds: readonly string[],
    method: PaymentMethod,
    receipt?: Blob,
  ): Promise<void> {
    const path = `/trainers/${trainerId}/commissions/settle`;
    const fields = {
      commissionIds: JSON.stringify(commissionIds),
      paymentMethod: method,
    };
    await (receipt
      ? apiFetch<void>(path, {
          method: "POST",
          formData: toFormData(fields, receipt, "receipt"),
        })
      : apiFetch<void>(path, { method: "POST", body: fields }));
  }

  commissionReceiptUrl(trainerId: TrainerId, commissionId: string): string {
    return `${API_BASE}/trainers/${trainerId}/commissions/${commissionId}/receipt`;
  }

  /**
   * There is no direct "create commission" endpoint — the backend generates
   * one automatically from `POST /payments` (`PaymentCommissionService`).
   */
  recordCommission(): Promise<Commission> {
    throw new Error(
      "Las comisiones se generan automáticamente al registrar un pago — no se crean directamente.",
    );
  }
}
