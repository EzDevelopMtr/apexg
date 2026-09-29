import type {
  IsoDate,
  Payment,
  PaymentKind,
  PaymentId,
  PaymentMethod,
} from "@apexg/core";
import {
  fromApiString,
  toApiString,
  toClientId,
  toCycleId,
  toIsoDate,
  toMembershipTypeId,
  toPaymentId,
} from "@apexg/core";
import type { PaymentRepository } from "../repositories";
import { API_BASE, apiFetch } from "./http-client";

type ApiPaymentType =
  "full" | "first_installment" | "second_installment" | "final_installment";

interface ApiPaymentResult {
  id: string;
  clientMembershipId: string;
  /** The membership the payment belongs to — current or not. */
  membership: {
    clientId: string;
    membershipTypeId: string;
    agreedPrice: string;
    startDate: string;
  };
  amount: string;
  paymentType: ApiPaymentType;
  installmentNumber: number;
  paymentMethod: PaymentMethod;
  balanceAfter: string;
  paidAt: string;
  notes: string | null;
  receiptPath: string | null;
  recordedBy: string;
}

/** Only what `/clients/:id` carries that recording a payment needs. */
interface ClientLookupRow {
  currentMembership: { id: string } | null;
}

/**
 * `payment_method` is a free VARCHAR with no CHECK, so a row can hold a value
 * outside the two the domain knows — the ones migration 009 normalised, or
 * anything written straight to the table later. Anything unrecognised reads as
 * a transfer: it means money that arrived outside the cash drawer, which is
 * what the distinction is for. Same treatment `toUnit` gives inventory units.
 */
function toMethod(raw: string): PaymentMethod {
  return raw === "cash" ? "cash" : "transfer";
}

const KIND_BY_TYPE: Record<ApiPaymentType, PaymentKind> = {
  full: "full",
  first_installment: "installment",
  second_installment: "installment",
  final_installment: "finalInstallment",
};

/**
 * The payment fields plus its receipt, as one multipart body.
 *
 * Every value goes in as a string: multipart has no types, and the backend's
 * DTO already treats `amount` as a string it validates by pattern.
 */
function toFormData(fields: Record<string, string>, receipt: Blob): FormData {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    form.append(key, value);
  }
  // The field name the endpoint's FileInterceptor listens on.
  form.append("receipt", receipt);
  return form;
}
function fromResult(row: ApiPaymentResult): Payment {
  const { membership } = row;
  const clientId = toClientId(membership.clientId);
  // Notes come back exactly as stored. They used to be unpacked with a regex,
  // because `reference` had no column and travelled folded in here behind a
  // "Referencia:" prefix; the field is gone and so is that convention.
  return {
    id: toPaymentId(row.id),
    clientId,
    cycleId: toCycleId(clientId, membership.startDate as IsoDate),
    membershipTypeId: toMembershipTypeId(membership.membershipTypeId),
    agreedPrice: fromApiString(membership.agreedPrice),
    amount: fromApiString(row.amount),
    balanceAfter: fromApiString(row.balanceAfter),
    kind: KIND_BY_TYPE[row.paymentType],
    sequence: row.installmentNumber,
    // `paidAt` is a UTC instant (TIMESTAMPTZ) — slicing its first 10
    // characters would read as tomorrow for any payment recorded after
    // 7pm Colombia time. Same class of bug already fixed twice on the
    // backend (`toLocalDate`); converting through a real `Date` reads
    // the browser's local calendar day instead of UTC's.
    paidOn: toIsoDate(new Date(row.paidAt)),
    method: toMethod(row.paymentMethod),
    receiptPath: row.receiptPath ?? "",
    recordedBy: row.recordedBy,
    notes: row.notes ?? "",
  };
}

export class HttpPaymentRepository implements PaymentRepository {
  async list(): Promise<readonly Payment[]> {
    const rows = await apiFetch<ApiPaymentResult[]>("/payments");
    return rows.map(fromResult);
  }

  receiptUrl(paymentId: PaymentId): string {
    return `${API_BASE}/payments/${paymentId}/receipt`;
  }

  async record(draft: Omit<Payment, "id">, receipt?: Blob): Promise<Payment> {
    const client = await apiFetch<ClientLookupRow>(
      `/clients/${draft.clientId}`,
    );
    const membership = client.currentMembership;
    if (!membership) {
      throw new Error(
        "El cliente no tiene una membresía vigente para registrar un pago.",
      );
    }

    const fields: Record<string, string> = {
      clientMembershipId: membership.id,
      amount: toApiString(draft.amount),
      paymentMethod: draft.method,
      // No `paidAt`: the form never lets `paidOn` be anything but today
      // (see `use-record-payment.ts`), so the backend's own default (the
      // server's current instant) already means the same thing — and
      // sidesteps reconstructing a timestamp whose UTC offset would need
      // to land on the right LOCAL calendar day (see `paidOn` above).
    };
    if (draft.notes.trim()) fields.notes = draft.notes.trim();

    // Multipart whenever there is a file. The endpoint reads both shapes, so
    // a cash payment stays a plain JSON POST rather than paying for a
    // multipart envelope it has nothing to put in.
    const row = receipt
      ? await apiFetch<ApiPaymentResult>("/payments", {
          method: "POST",
          formData: toFormData(fields, receipt),
        })
      : await apiFetch<ApiPaymentResult>("/payments", {
          method: "POST",
          body: fields,
        });

    return fromResult(row);
  }
}
