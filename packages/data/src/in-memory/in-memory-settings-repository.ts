import type { GymSettings } from "@apexg/core";
import { DEFAULT_GYM_SETTINGS } from "@apexg/core";
import type { SettingsRepository } from "../settings";

/** No platform behind it: the defaults. */
export class InMemorySettingsRepository implements SettingsRepository {
  get(): Promise<GymSettings> {
    return Promise.resolve(DEFAULT_GYM_SETTINGS);
  }
}
