import type { ClientId, ReminderRecord } from "@apexg/core";
import { toClientId, toIsoDate } from "@apexg/core";
import type { ClientReminderRepository } from "../repositories";
import { apiFetch } from "./http-client";

interface ApiReminder {
  clientId: string;
  sentAt: string;
  sentByName: string | null;
}

function fromApi(row: ApiReminder): ReminderRecord {
  return {
    clientId: toClientId(row.clientId),
    sentOn: toIsoDate(new Date(row.sentAt)),
    sentByName: row.sentByName,
  };
}

export class HttpClientReminderRepository implements ClientReminderRepository {
  async listLatest(): Promise<readonly ReminderRecord[]> {
    const rows = await apiFetch<ApiReminder[]>("/client-reminders");
    return rows.map(fromApi);
  }

  async record(clientId: ClientId): Promise<ReminderRecord> {
    return fromApi(await apiFetch<ApiReminder>(`/client-reminders/${clientId}`, { method: "POST" }));
  }
}
