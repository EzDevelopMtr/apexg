import { describe, expect, it } from "vitest";

import type { IsoDate } from "./calendar";
import { isIsoDate, rangeFor } from "./calendar";
import type { Client } from "./client";
import { toClientId } from "./client";
import type { Expense } from "./expense";
import { toExpenseId } from "./expense";
import type { FinancialRecords } from "./finance";
import { calculateBalance } from "./finance";
import { trendOver } from "./finance-period";
import { toDayPassId } from "./day-pass";
import {
  DAY_PASSES_KEY,
  PRODUCT_SALES_KEY,
  expensesByCategory,
  incomeBySource,
  pendingCommissions,
  profitMargin,
  receivables,
  renewalOutlook,
} from "./finance-insights";
import { toInventoryItemId } from "./inventory";
import type { MembershipTypeId } from "./membership";
import { toMembershipTypeId } from "./membership";
import { fromPesos } from "./money";
import type { Payment } from "./payment";
import { toCycleId, toPaymentId } from "./payment";
import type { ProductSale } from "./product-sale";
import { toProductSaleId } from "./product-sale";
import type { Commission } from "./trainer";
import { toTrainerId } from "./trainer";

const date = (value: string): IsoDate => {
  if (!isIsoDate(value)) throw new Error(`fecha inválida: ${value}`);
  return value;
};

const HOY = date("2026-09-20");
const MENSUAL = toMembershipTypeId("mensual");
const PERSONAL = toMembershipTypeId("personal");

function pago(id: string, overrides: Partial<Payment> = {}): Payment {
  const clientId = toClientId(`c-${id}`);
  return {
    id: toPaymentId(id),
    clientId,
    cycleId: toCycleId(clientId, date("2026-09-01")),
    membershipTypeId: MENSUAL,
    agreedPrice: fromPesos(65_000),
    amount: fromPesos(65_000),
    balanceAfter: fromPesos(0),
    kind: "full",
    sequence: 1,
    paidOn: date("2026-09-10"),
    method: "cash",
    receiptPath: "",
    recordedBy: "apexg",
    notes: "",
    ...overrides,
  };
}

function egreso(id: string, categoryId: string, pesos: number, spentOn: string): Expense {
  return {
    id: toExpenseId(id),
    categoryId,
    description: "",
    amount: fromPesos(pesos),
    spentOn: date(spentOn),
    recordedBy: "apexg",
  };
}

function venta(id: string, pesos: number, soldOn: string): ProductSale {
  return {
    id: toProductSaleId(id),
    inventoryItemId: toInventoryItemId("item"),
    itemName: "Proteína",
    quantity: 1,
    amount: fromPesos(pesos),
    paymentMethod: "cash",
    soldOn: date(soldOn),
    notes: "",
    recordedBy: "apexg",
  };
}

function cliente(id: string, expirationDate: string, overrides: Partial<Client> = {}): Client {
  return {
    id: toClientId(id),
    fullName: id,
    idNumber: id,
    phone: "",
    email: "",
    membershipTypeId: MENSUAL,
    status: "active",
    startDate: date("2026-08-01"),
    expirationDate: date(expirationDate),
    emergencyContactName: "",
    emergencyContactPhone: "",
    bloodType: "",
    medicalCondition: "",
    hasPhoto: false,
    ...overrides,
  };
}

const REGISTROS: FinancialRecords = {
  payments: [
    pago("p1"),
    pago("p2", { membershipTypeId: PERSONAL, amount: fromPesos(200_000) }),
    pago("p3", { paidOn: date("2026-08-15") }),
  ],
  productSales: [venta("s1", 20_000, "2026-09-12")],
  dayPasses: [
    {
      id: toDayPassId("d1"),
      membershipTypeId: toMembershipTypeId("day"),
      visitorName: "Visitante",
      visitorContact: "",
      amount: fromPesos(6_000),
      paymentMethod: "cash",
      soldOn: date("2026-09-20"),
      soldAt: "08:00",
      receiptPath: "",
      recordedBy: "Recepción",
    },
  ],
  expenses: [
    egreso("e1", "servicios", 150_000, "2026-09-05"),
    egreso("e2", "servicios", 100_000, "2026-08-05"),
    egreso("e3", "aseo", 30_000, "2026-08-20"),
  ],
  clients: [],
  savings: [],
};

const NOMBRE_PLAN = (id: MembershipTypeId) =>
  id === MENSUAL ? "Mensualidad" : "Personalizado";

describe("trendOver por meses", () => {
  const TRIMESTRE = { from: date("2026-07-01"), to: date("2026-09-30") };

  it("devuelve los meses del más viejo al actual", () => {
    const tendencia = trendOver(REGISTROS, TRIMESTRE, HOY);
    expect(tendencia.map((mes) => mes.key)).toEqual(["2026-07", "2026-08", "2026-09"]);
    expect(tendencia.map((mes) => mes.label)).toEqual(["jul", "ago", "sep"]);
  });

  it("cada mes trae sus propios ingresos, egresos y utilidad", () => {
    const [julio, agosto, septiembre] = trendOver(REGISTROS, TRIMESTRE, HOY);
    expect(julio?.income).toBe(fromPesos(0));
    expect(agosto?.income).toBe(fromPesos(65_000));
    expect(agosto?.expenses).toBe(fromPesos(130_000));
    // 200.000 + 65.000 en pagos, 20.000 en productos y 6.000 de un pase.
    expect(septiembre?.income).toBe(fromPesos(291_000));
    expect(septiembre?.profit).toBe(fromPesos(141_000));
  });
});

describe("profitMargin", () => {
  it("es la utilidad sobre los ingresos, en porcentaje", () => {
    // 141.000 / 291.000 = 48,45 %.
    expect(profitMargin(calculateBalance(REGISTROS, "month", HOY))).toBe(48);
  });

  it("sin ingresos no hay margen que calcular", () => {
    expect(profitMargin(calculateBalance(REGISTROS, "month", date("2026-07-10")))).toBeNull();
  });
});

describe("incomeBySource", () => {
  it("agrupa por plan, suma productos y pases de día, y ordena de mayor a menor", () => {
    const origen = incomeBySource(REGISTROS, rangeFor("month", HOY), NOMBRE_PLAN);
    expect(origen.map((o) => [o.label, o.amount])).toEqual([
      ["Personalizado", fromPesos(200_000)],
      ["Mensualidad", fromPesos(65_000)],
      ["Venta de productos", fromPesos(20_000)],
      ["Pases de día", fromPesos(6_000)],
    ]);
    expect(origen[2]?.key).toBe(PRODUCT_SALES_KEY);
    expect(origen[3]?.key).toBe(DAY_PASSES_KEY);
  });

  it("sin ventas en el periodo no aparece el rubro de productos", () => {
    const origen = incomeBySource(REGISTROS, rangeFor("month", date("2026-08-10")), NOMBRE_PLAN);
    expect(origen.map((o) => o.key)).toEqual([MENSUAL]);
  });
});

describe("expensesByCategory", () => {
  it("compara cada categoría con el mes anterior, incluida la que este mes no gastó", () => {
    const gastos = expensesByCategory(
      REGISTROS.expenses,
      rangeFor("month", HOY),
      rangeFor("month", date("2026-08-10")),
      (id) => id,
    );
    expect(gastos).toEqual([
      { key: "servicios", label: "servicios", amount: fromPesos(150_000), previous: fromPesos(100_000) },
      { key: "aseo", label: "aseo", amount: fromPesos(0), previous: fromPesos(30_000) },
    ]);
  });
});

describe("receivables y pendingCommissions", () => {
  it("solo cuentan los abonos cuyo ciclo todavía tiene saldo", () => {
    const pendiente = pago("a1", {
      kind: "installment",
      amount: fromPesos(100_000),
      balanceAfter: fromPesos(100_000),
    });
    expect(receivables([pago("p1"), pendiente]).map((r) => r.amount)).toEqual([
      fromPesos(100_000),
    ]);
  });

  it("las comisiones ya pagadas no se deben", () => {
    const comision = (id: string, pesos: number, settled: boolean): Commission => ({
      id,
      trainerId: toTrainerId("t1"),
      paymentId: toPaymentId(id),
      clientId: toClientId("c1"),
      amount: fromPesos(pesos),
      earnedOn: HOY,
      settled,
    });
    expect(pendingCommissions([comision("k1", 100_000, false), comision("k2", 50_000, true)])).toBe(
      fromPesos(100_000),
    );
  });
});

describe("renewalOutlook", () => {
  const precio = () => fromPesos(65_000);
  const clientes = [
    cliente("vence-pronto", "2026-09-25"),
    cliente("vence-lejos", "2026-12-01"),
    cliente("en-mora", "2026-09-01"),
    cliente("retirado", "2026-09-01", { status: "inactive" }),
  ];

  it("separa renovaciones por cerrar e ingreso en riesgo, con su valor", () => {
    const panorama = renewalOutlook(clientes, precio, HOY);
    expect(panorama.expiring.clients.map((c) => c.id)).toEqual(["vence-pronto"]);
    expect(panorama.expiring.value).toBe(fromPesos(65_000));
    expect(panorama.overdue.clients.map((c) => c.id)).toEqual(["en-mora"]);
    // El retirado no está en mora: ya se fue, no hay nada que recuperar.
    expect(panorama.activeCount).toBe(2);
  });
});
