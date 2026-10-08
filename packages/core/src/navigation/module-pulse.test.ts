import { describe, expect, it } from "vitest";
import type { IsoDate } from "../domain/calendar";
import { isIsoDate } from "../domain/calendar";
import type { Client } from "../domain/client";
import { toClientId } from "../domain/client";
import type { DayPass } from "../domain/day-pass";
import { toDayPassId } from "../domain/day-pass";
import { DEFAULT_GYM_SETTINGS } from "../domain/gym-settings";
import { toInventoryItemId } from "../domain/inventory";
import { toMembershipTypeId } from "../domain/membership";
import { fromPesos } from "../domain/money";
import type { Payment } from "../domain/payment";
import { toCycleId, toPaymentId } from "../domain/payment";
import type { ProductSale } from "../domain/product-sale";
import { toProductSaleId } from "../domain/product-sale";
import { buildModulePulse } from "./module-pulse";

const date = (value: string): IsoDate => {
  if (!isIsoDate(value)) throw new Error(`bad test date: ${value}`);
  return value;
};
const TODAY = date("2026-06-15");

function client(id: string, overrides: Partial<Client> = {}): Client {
  return {
    id: toClientId(id), fullName: `Cliente ${id}`, idNumber: id, phone: "", email: "",
    membershipTypeId: toMembershipTypeId("monthly"), status: "active",
    startDate: date("2026-06-01"), expirationDate: date("2026-07-01"),
    emergencyContactName: "", emergencyContactPhone: "", bloodType: "", medicalCondition: "", hasPhoto: false,
    ...overrides,
  };
}
function payment(id: string, paidOn: string, pesos: number): Payment {
  const clientId = toClientId("c-1");
  return {
    id: toPaymentId(id), clientId, cycleId: toCycleId(clientId, date("2026-06-01")), membershipTypeId: toMembershipTypeId("monthly"),
    agreedPrice: fromPesos(65_000), amount: fromPesos(pesos), balanceAfter: fromPesos(0), kind: "full", sequence: 1,
    paidOn: date(paidOn), method: "cash", receiptPath: "", recordedBy: "apexg", notes: "",
  };
}
const sale = (pesos: number, soldOn = "2026-06-15"): ProductSale => ({
  id: toProductSaleId(`s-${pesos}`), inventoryItemId: toInventoryItemId("i"), itemName: "Agua", quantity: 1,
  amount: fromPesos(pesos), paymentMethod: "cash", soldOn: date(soldOn), notes: "", recordedBy: "r",
});
const pass = (pesos: number): DayPass => ({
  id: toDayPassId(`p-${pesos}`), visitorName: "Visitante", amount: fromPesos(pesos), paymentMethod: "cash",
  soldOn: TODAY, soldAt: "07:00", receiptPath: "", recordedBy: "r",
});

describe("buildModulePulse", () => {
  const records = {
    clients: [
      client("al-dia"),
      client("por-vencer", { expirationDate: date("2026-06-18") }),
      client("en-mora", { expirationDate: date("2026-06-01") }),
      client("nuevo", { startDate: TODAY, expirationDate: date("2026-07-15") }),
    ],
    payments: [payment("hoy", "2026-06-15", 65_000), payment("ayer", "2026-06-14", 50_000)],
    productSales: [sale(4_000), sale(9_000, "2026-06-10")],
    dayPasses: [pass(6_000)],
    checkInsToday: 12,
  };

  it("el apartado diario suma pagos, ventas y pases de HOY, y cuenta ingresos y clientes nuevos", () => {
    expect(buildModulePulse(records, TODAY).dailyLog).toEqual({
      income: fromPesos(65_000 + 4_000 + 6_000),
      checkIns: 12,
      newClients: 1,
    });
  });

  it("clientes cuenta con los mismos filtros de su listado", () => {
    expect(buildModulePulse(records, TODAY).clients).toEqual({ total: 4, expiring: 1, overdue: 1 });
  });

  it("pagos muestra solo lo cobrado hoy, no ventas ni pases", () => {
    expect(buildModulePulse(records, TODAY).payments).toEqual({ collectedToday: fromPesos(65_000), paymentsToday: 1 });
  });

  it("respeta los días de gracia del gimnasio", () => {
    const conGracia = buildModulePulse(records, TODAY, { ...DEFAULT_GYM_SETTINGS, graceDays: 30 });
    expect(conGracia.clients.overdue).toBe(0);
  });
});
