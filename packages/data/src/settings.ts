import type { GymSettings } from "@apexg/core";

/** The settings in force for the signed-in gym. Read-only: the super admin edits them. */
export interface SettingsRepository {
  get(): Promise<GymSettings>;
}
