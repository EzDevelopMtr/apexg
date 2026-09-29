import type { DayPass, DayPassId, PaymentMethod } from "@apexg/core";
import {
  fromApiString,
  toDayPassId,
  toIsoDate,
  toMembershipTypeId,
} from "@apexg/core";
import type { DayPassRepository, DayPassSale } from "../repositories";
import { API_BASE, apiFetch } from "./http-client";
import { localTime } from "./local-time";
import { toFormData } from "./multipart";

interface ApiDayPassResult {
  id: string;
  membershipTypeId: string;
  visitorName: string;
  visitorContact: string | null;
  amount: string;
  paymentMethod: string;
  soldAt: string;
  receiptPath: string | null;
  recordedBy: string;
}

function fromResult(row: ApiDayPassResult): DayPass {
  return {
    id: toDayPassId(row.id),
    membershipTypeId: toMembershipTypeId(row.membershipTypeId),
    visitorName: row.visitorName,
    visitorContact: row.visitorContact ?? "",
    amount: fromApiString(row.amount),
    // Same reading as payments: anything that is not cash arrived outside
    // the drawer.
    paymentMethod: (row.paymentMethod === "cash" ? "cash" : "transfer") as PaymentMethod,
    // `sold_at` is a TIMESTAMPTZ instant; the local calendar day and clock
    // come from a real `Date`, never from slicing the ISO string.
    soldOn: toIsoDate(new Date(row.soldAt)),
    soldAt: localTime(row.soldAt),
    receiptPath: row.receiptPath ?? "",
    recordedBy: row.recordedBy,
  };
}

export class HttpDayPassRepository implements DayPassRepository {
  async list(): Promise<readonly DayPass[]> {
    const rows = await apiFetch<ApiDayPassResult[]>("/day-passes");
    return rows.map(fromResult);
  }

  async sell(sale: DayPassSale, receipt?: Blob): Promise<DayPass> {
    const fields = {
      visitorName: sale.visitorName.trim(),
      visitorContact: sale.visitorContact.trim() || undefined,
      paymentMethod: sale.paymentMethod,
    };
    const row = receipt
      ? await apiFetch<ApiDayPassResult>("/day-passes", {
          method: "POST",
          formData: toFormData(fields, receipt, "receipt"),
        })
      : await apiFetch<ApiDayPassResult>("/day-passes", {
          method: "POST",
          body: fields,
        });
    return fromResult(row);
  }

  receiptUrl(id: DayPassId): string {
    return `${API_BASE}/day-passes/${id}/receipt`;
  }
}
