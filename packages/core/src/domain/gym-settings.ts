import { DEFAULT_GRACE_DAYS, EXPIRING_SOON_DAYS } from "./client";
import { DEFAULT_REMINDER_TEMPLATES } from "./renewal-reminder";
import type { ReminderTemplates } from "./renewal-reminder";

/**
 * The settings in force for the gym being served, as the super admin left
 * them (a general value, or this gym's exception). The rules in this package
 * take them as parameters; they never read them from anywhere.
 */
export interface GymSettings {
  /** RF-21: days a client may stay unpaid past expiry before turning overdue. */
  readonly graceDays: number;
  /** Window of the "por vencer" view. */
  readonly expiringSoonDays: number;
  /** Module ids this gym may open. */
  readonly enabledModules: readonly string[];
  /** How this gym words the WhatsApp renewal reminder. */
  readonly reminderTemplates: ReminderTemplates;
}

/** What a gym gets while its settings load, or with no backend at all. */
export const DEFAULT_GYM_SETTINGS: GymSettings = {
  graceDays: DEFAULT_GRACE_DAYS,
  expiringSoonDays: EXPIRING_SOON_DAYS,
  enabledModules: [
    "clients",
    "memberships",
    "payments",
    "trainers",
    "expenses",
    "inventory",
    "finances",
    "dailyLog",
  ],
  reminderTemplates: DEFAULT_REMINDER_TEMPLATES,
};

export function isModuleEnabled(settings: GymSettings, moduleId: string): boolean {
  return settings.enabledModules.includes(moduleId);
}
