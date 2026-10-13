import type { ClientId, ReminderRecord } from "@apexg/core";

/** Renewal reminders opened from the client list (WhatsApp). */
export interface ClientReminderRepository {
  /** Each client's latest reminder, recent ones only. */
  listLatest(): Promise<readonly ReminderRecord[]>;
  /** Records that the desk opened the chat. The server stamps the time. */
  record(clientId: ClientId): Promise<ReminderRecord>;
}
