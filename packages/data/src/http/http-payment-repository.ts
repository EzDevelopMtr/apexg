import type {
  ClientId,
  CycleId,
  IsoDate,
  MembershipTypeId,
  Money,
  Payment,
  PaymentKind,
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
import { apiFetch } from "./http-client";

type ApiPaymentType =
  "full" | "first_installment" | "second_installment" | "final_installment";

interface ApiPaymentResult {
  id: string;
  clientMembershipId: string;
  amount: string;
  paymentType: ApiPaymentType;
  installmentNumber: number;
  paymentMethod: PaymentMethod;
  balanceAfter: string;
  paidAt: string;
  notes: string | null;
  receiptPath: string | null;
}

/** Only what `/clients` carries that a payment needs to resolve its cycle. */
interface ClientLookupRow {
  id: string;
  currentMembership: {
    id: string;
    membershipTypeId: string;
    agreedPrice: string;
    startDate: string;
  } | null;
}

interface MembershipContext {
  clientId: ClientId;
  membershipTypeId: MembershipTypeId;
  agreedPrice: Money;
  cycleId: CycleId;
}

const KIND_BY_TYPE: Record<ApiPaymentType, PaymentKind> = {
  full: "full",
  first_installment: "installment",
  second_installment: "installment",
  final_installment: "finalInstallment",
};

/**
 * `Payment.reference` (required by the form, RF-17) has no backend column —
 * only `notes` exists. It travels folded into `notes` with a recognizable
 * prefix so a reload still shows the same reference in `PaymentRow`, and is
 * split back apart on read. A `notes` value that predates this convention
 * (e.g. seeded directly) just reads back as plain notes with no reference,
 * rather than being misparsed.
 */
const REFERENCE_PREFIX = /^Referencia: (.+?)(?: — ([\s\S]*))?$/;

function composeNotes(reference: string, notes: string): string | undefined {
  const parts: string[] = [];
  if (reference.trim()) parts.push(`Referencia: ${reference.trim()}`);
  if (notes.trim()) parts.push(notes.trim());
  return parts.length > 0 ? parts.join(" — ") : undefined;
}

function splitNotes(raw: string | null): { reference: string; notes: string } {
  if (!raw) return { reference: "", notes: "" };
  const match = REFERENCE_PREFIX.exec(raw);
  if (!match) return { reference: "", notes: raw };
  return { reference: match[1] ?? "", notes: match[2] ?? "" };
}

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
function fromResult(
  row: ApiPaymentResult,
  context: MembershipContext,
): Payment {
  const { reference, notes } = splitNotes(row.notes);
  return {
    id: toPaymentId(row.id),
    clientId: context.clientId,
    cycleId: context.cycleId,
    membershipTypeId: context.membershipTypeId,
    agreedPrice: context.agreedPrice,
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
    method: row.paymentMethod,
    reference,
    receiptPath: row.receiptPath ?? "",
    recordedBy: "",
    notes,
  };
}

export class HttpPaymentRepository implements PaymentRepository {
  /**
   * `GET /payments` only carries `clientMembershipId` — resolving `clientId`,
   * plan and agreed price needs a join against `/clients`, which exposes
   * only each client's CURRENT membership. There is today no way to create
   * a second membership for an existing client (no renew endpoint yet), so
   * "current" and "the one every existing payment belongs to" are the same
   * thing — this will need revisiting once renewals exist.
   */
  private async loadMembershipContexts(): Promise<
    Map<string, MembershipContext>
  > {
    const rows = await apiFetch<ClientLookupRow[]>("/clients");
    const contexts = new Map<string, MembershipContext>();
    for (const row of rows) {
      const membership = row.currentMembership;
      if (!membership) continue;
      contexts.set(membership.id, {
        clientId: toClientId(row.id),
        membershipTypeId: toMembershipTypeId(membership.membershipTypeId),
        agreedPrice: fromApiString(membership.agreedPrice),
        cycleId: toCycleId(toClientId(row.id), membership.startDate as IsoDate),
      });
    }
    return contexts;
  }

  async list(): Promise<readonly Payment[]> {
    const [rows, contexts] = await Promise.all([
      apiFetch<ApiPaymentResult[]>("/payments"),
      this.loadMembershipContexts(),
    ]);

    return rows.map((row) => {
      const context = contexts.get(row.clientMembershipId);
      if (!context) {
        throw new Error(
          "Este pago pertenece a una membresía que ya no es la vigente del cliente " +
            "(el backend todavía no expone membresías históricas por separado).",
        );
      }
      return fromResult(row, context);
    });
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
    const notes = composeNotes(draft.reference, draft.notes);
    if (notes !== undefined) fields.notes = notes;

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

    const context: MembershipContext = {
      clientId: draft.clientId,
      membershipTypeId: draft.membershipTypeId,
      agreedPrice: draft.agreedPrice,
      cycleId: draft.cycleId,
    };
    return fromResult(row, context);
  }
}
