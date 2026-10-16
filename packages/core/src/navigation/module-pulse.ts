import type { IsoDate } from "../domain/calendar";
import type { Client } from "../domain/client";
import type { DayPass } from "../domain/day-pass";
import { buildDailyLog } from "../domain/finance";
import type { GymSettings } from "../domain/gym-settings";
import { DEFAULT_GYM_SETTINGS } from "../domain/gym-settings";
import type { Money } from "../domain/money";
import { add } from "../domain/money";
import type { Payment } from "../domain/payment";
import type { ProductSale } from "../domain/product-sale";
import { countClientsBySection } from "./client-sections";

/**
 * The live figures on the selector's daily cards: enough to decide where to
 * go without opening anything. Each comes from the same rule its module uses
 * — the day's income from `buildDailyLog`, the client counts from the list
 * filters — so the card and the module never disagree.
 */
export interface ModulePulse {
  readonly dailyLog: { readonly income: Money; readonly checkIns: number; readonly newClients: number };
  readonly clients: { readonly total: number; readonly expiring: number; readonly overdue: number };
  readonly payments: { readonly collectedToday: Money; readonly paymentsToday: number };
}

export interface PulseRecords {
  readonly clients: readonly Client[];
  readonly payments: readonly Payment[];
  readonly productSales: readonly ProductSale[];
  readonly dayPasses: readonly DayPass[];
  /** People who came in today: the attendance list's length. */
  readonly checkInsToday: number;
}

export function buildModulePulse(
  records: PulseRecords,
  on: IsoDate,
  settings: GymSettings = DEFAULT_GYM_SETTINGS,
): ModulePulse {
  const day = buildDailyLog(records, [], on);
  const counts = countClientsBySection(records.clients, on, settings);
  return {
    dailyLog: { income: day.income, checkIns: records.checkInsToday, newClients: day.newClients.length },
    clients: { total: counts.all ?? 0, expiring: counts.expiring ?? 0, overdue: counts.overdue ?? 0 },
    // Lo mismo que lista Pagos: mensualidades y pases de día. Las ventas de
    // productos viven en el apartado diario, no en Pagos.
    payments: {
      collectedToday: add(day.incomeFromPayments, day.incomeFromDayPasses),
      paymentsToday:
        records.payments.filter((payment) => payment.paidOn === on).length +
        records.dayPasses.filter((pass) => pass.soldOn === on).length,
    },
  };
}
