import type { GymSettings } from "@apexg/core";
import type { SettingsRepository } from "../settings";
import { apiFetch } from "./http-client";

/** Keys as the backend catalog names them (settings/setting-definitions.ts). */
interface ApiSettings {
  "clients.graceDays": number;
  "clients.expiringSoonDays": number;
  "modules.enabled": string[];
}

export class HttpSettingsRepository implements SettingsRepository {
  async get(): Promise<GymSettings> {
    const api = await apiFetch<ApiSettings>("/settings");
    return {
      graceDays: api["clients.graceDays"],
      expiringSoonDays: api["clients.expiringSoonDays"],
      enabledModules: api["modules.enabled"],
    };
  }
}
