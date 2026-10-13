import type { ReminderRecord } from "@apexg/core";
import type { ClientReminderRepository } from "../repositories";

/**
 * No reminders without a server: an empty history rather than an invented
 * one, and recording fails loudly instead of pretending it was kept.
 */
export class InMemoryClientReminderRepository implements ClientReminderRepository {
  async listLatest(): Promise<readonly ReminderRecord[]> {
    return [];
  }

  async record(): Promise<ReminderRecord> {
    throw new Error("Registrar recordatorios requiere el backend.");
  }
}
