import { clientSections } from "./client-sections";
import { dailyLogSections } from "./daily-log-sections";
import { expenseSections } from "./expense-sections";
import { financeSections } from "./finance-sections";
import { inventorySections } from "./inventory-sections";
import { membershipSections } from "./membership-sections";
import { paymentSections } from "./payment-sections";
import { trainerSections } from "./trainer-sections";
import type { IconName } from "./icons";
import type { ModuleSection } from "./section-catalog";

/**
 * What navigation needs from a section, and nothing more.
 *
 * Sections carry predicates, and a function cannot cross the server/client
 * boundary. Stripping them here means a sidebar can never accidentally be
 * handed one.
 */
export interface NavigableSection {
  readonly id: string;
  readonly label: string;
  readonly icon: IconName;
}

function toNavigable(
  sections: readonly ModuleSection<string, never>[],
): readonly NavigableSection[] {
  return sections.map(({ id, label, icon }) => ({ id, label, icon }));
}

/** Navigation for each module, keyed by module id. Plain data only. */
export const NAV_SECTIONS: Record<string, readonly NavigableSection[]> = {
  clients: toNavigable(clientSections.sections),
  memberships: toNavigable(membershipSections.sections),
  payments: toNavigable(paymentSections.sections),
  trainers: toNavigable(trainerSections.sections),
  expenses: toNavigable(expenseSections.sections),
  inventory: toNavigable(inventorySections.sections),
  finances: toNavigable(financeSections.sections),
  dailyLog: toNavigable(dailyLogSections.sections),
};

export function navSectionsFor(moduleId: string): readonly NavigableSection[] {
  return NAV_SECTIONS[moduleId] ?? [];
}
