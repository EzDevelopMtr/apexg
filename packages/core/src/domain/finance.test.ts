import { describe, expect, it } from "vitest";
import type { IsoDate } from "./calendar";
import { isIsoDate } from "./calendar";
import type { Client } from "./client";
import { toClientId } from "./client";
import type { Expense } from "./expense";
import { toExpenseId } from "./expense";
import { fromPesos } from "./money";
import type { Payment } from "./payment";
import { toCycleId, toPaymentId } from "./payment";
import {
  buildDailyLog,
  calculateBalance,
  compareWithPreviousMonth,
  percentChange,
} from "./finance";

const date = (value: string): IsoDate => {
  if (!isIsoDate(value)) throw new Error(`bad test date: ${value}`);
  return value;
};

const TODAY = date("2026-06-18");

function client(id: string, overrides: Partial<Client> = {}): Client {
  return {
    id: toClientId(id),
    fullName: `Client ${id}`,
    idNumber: id,
    phone: "3000000000",
    email: `${id}@email.com`,
    membershipTypeId: "monthly",
    status: "active",
    startDate: date("2026-06-01"),
    expirationDate: date("2026-07-01"),
    ...overrides,
  };
}

function payment(id: string, paidOn: string, pesos: number): Payment {
  const clientId = toClientId("c-1");
  return {
    id: toPaymentId(id),
    clientId,
    cycleId: toCycleId(clientId, date("2026-06-01")),
    membershipTypeId: "monthly",
    agreedPrice: fromPesos(65_000),
    amount: fromPesos(pesos),
    balanceAfter: fromPesos(0),
    kind: "full",
    sequence: 1,
    paidOn: date(paidOn),
    method: "cash",
    reference: id,
    recordedBy: "apexg",
    notes: "",
  };
}

function expense(id: string, spentOn: string, pesos: number): Expense {
  return {
    id: toExpenseId(id),
    categoryId: "utilities",
    description: "Servicios",
    amount: fromPesos(pesos),
    spentOn: date(spentOn),
    recordedBy: "apexg",
  };
}

describe("calculateBalance (RF-31)", () => {
  const payments = [
    payment("p1", "2026-06-18", 65_000),
    payment("p2", "2026-06-16", 50_000),
    payment("p3", "2026-05-30", 45_000),
  ];
  const expenses = [
    expense("e1", "2026-06-18", 20_000),
    expense("e2", "2026-06-02", 100_000),
  ];

  it("adds up only the day in question", () => {
    const balance = calculateBalance(
      { payments, expenses, clients: [] },
      "day",
      TODAY,
    );
    expect(balance.income).toBe(fromPesos(65_000));
    expect(balance.expenses).toBe(fromPesos(20_000));
    expect(balance.profit).toBe(fromPesos(45_000));
  });

  it("adds up the Monday-to-Sunday week", () => {
    const balance = calculateBalance(
      { payments, expenses, clients: [] },
      "week",
      TODAY,
    );
    expect(balance.range).toEqual({ from: "2026-06-15", to: "2026-06-21" });
    expect(balance.income).toBe(fromPesos(115_000));
  });

  it("adds up the month and excludes the previous one", () => {
    const balance = calculateBalance(
      { payments, expenses, clients: [] },
      "month",
      TODAY,
    );
    expect(balance.range).toEqual({ from: "2026-06-01", to: "2026-06-30" });
    expect(balance.income).toBe(fromPesos(115_000));
    expect(balance.expenses).toBe(fromPesos(120_000));
    expect(balance.profit).toBe(fromPesos(-5_000));
  });

  it("counts clients by derived status, not the stored one (RF-33)", () => {
    // Every record below says status "active"; only the dates differ. Reading
    // the stored field would report all three as active.
    const clients = [
      client("current", { expirationDate: date("2026-07-01") }),
      client("lapsed", { expirationDate: date("2026-06-01") }),
      client("retired", { status: "inactive" }),
    ];

    const balance = calculateBalance(
      { payments: [], expenses: [], clients },
      "month",
      TODAY,
    );
    expect(balance.activeClients).toBe(1);
    expect(balance.overdueClients).toBe(1);
  });
});

describe("compareWithPreviousMonth (RF-32)", () => {
  it("compares June against May", () => {
    const payments = [
      payment("p1", "2026-06-10", 100_000),
      payment("p2", "2026-05-10", 50_000),
    ];

    const comparison = compareWithPreviousMonth(
      { payments, expenses: [], clients: [] },
      TODAY,
    );
    expect(comparison.current.income).toBe(fromPesos(100_000));
    expect(comparison.previous.income).toBe(fromPesos(50_000));
    expect(comparison.profitChangePercent).toBe(100);
  });

  it("steps back correctly from the 31st", () => {
    // previousMonth clamps, so this must not land in March.
    const comparison = compareWithPreviousMonth(
      { payments: [], expenses: [], clients: [] },
      date("2026-03-31"),
    );
    expect(comparison.previous.range.from).toBe("2026-02-01");
    expect(comparison.previous.range.to).toBe("2026-02-28");
  });
});

describe("percentChange", () => {
  it("never divides by zero", () => {
    expect(percentChange(fromPesos(0), fromPesos(0))).toBe(0);
    expect(percentChange(fromPesos(0), fromPesos(100))).toBe(100);
  });

  it("reports growth and decline", () => {
    expect(percentChange(fromPesos(100), fromPesos(150))).toBe(50);
    expect(percentChange(fromPesos(100), fromPesos(50))).toBe(-50);
  });

  it("handles a loss in the previous month", () => {
    // Dividing by a negative would flip the sign of the change.
    expect(percentChange(fromPesos(-100), fromPesos(-50))).toBe(50);
  });
});

describe("buildDailyLog (RF-34)", () => {
  it("collects the day's income, new clients and notes", () => {
    const clients = [
      client("new", { startDate: TODAY }),
      client("old", { startDate: date("2026-06-01") }),
    ];
    const notes = [
      {
        id: "n1",
        on: TODAY,
        text: "Se dañó una caminadora",
        recordedBy: "apexg",
      },
      { id: "n2", on: date("2026-06-17"), text: "Ayer", recordedBy: "apexg" },
    ];

    const log = buildDailyLog(
      { payments: [payment("p1", "2026-06-18", 65_000)], clients },
      notes,
      TODAY,
    );

    expect(log.income).toBe(fromPesos(65_000));
    expect(log.newClients.map((c) => c.id as string)).toEqual(["new"]);
    expect(log.notes).toHaveLength(1);
  });
});
