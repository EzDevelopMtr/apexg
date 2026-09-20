import { describe, expect, it } from "vitest";
import type { IsoDate } from "./calendar";
import { isIsoDate } from "./calendar";
import { toClientId } from "./client";
import { findMembershipType } from "./membership-catalog";
import { toMembershipTypeId } from "./membership";
import { fromPesos } from "./money";
import type { Money } from "./money";
import type { Payment, PaymentKind, PaymentMethod } from "./payment";
import {
  PAYMENT_METHOD_LABELS,
  checkPayment,
  cyclesWithBalance,
  classifyPayment,
  outstandingBalance,
  paymentLabel,
  requiresReceipt,
  toCycleId,
  toPaymentId,
  totalPaid,
} from "./payment";

const date = (value: string): IsoDate => {
  if (!isIsoDate(value)) throw new Error(`bad test date: ${value}`);
  return value;
};

const plan = (id: string) => {
  const type = findMembershipType(toMembershipTypeId(id));
  if (!type) throw new Error(`missing plan: ${id}`);
  return type;
};

const CLIENT = toClientId("c-1");
const CYCLE = toCycleId(CLIENT, date("2026-06-01"));

function makePayment(
  sequence: number,
  amount: Money,
  balanceAfter: Money,
  kind: PaymentKind = "installment",
): Payment {
  return {
    id: toPaymentId(`p-${sequence}`),
    clientId: CLIENT,
    cycleId: CYCLE,
    membershipTypeId: toMembershipTypeId("monthly"),
    agreedPrice: fromPesos(65_000),
    amount,
    balanceAfter,
    kind,
    sequence,
    paidOn: date("2026-06-01"),
    method: "cash",
    reference: `REF-${sequence}`,
    receiptPath: "",
    recordedBy: "apexg",
    notes: "",
  };
}

describe("outstanding balance (RF-18)", () => {
  const price = fromPesos(65_000);

  it("is the full price before any payment", () => {
    expect(outstandingBalance([], CYCLE, price)).toBe(price);
  });

  it("shrinks with each instalment", () => {
    const payments = [
      makePayment(1, fromPesos(30_000), fromPesos(35_000)),
      makePayment(2, fromPesos(30_000), fromPesos(5_000)),
    ];
    expect(totalPaid(payments, CYCLE)).toBe(fromPesos(60_000));
    expect(outstandingBalance(payments, CYCLE, price)).toBe(fromPesos(5_000));
  });

  it("never goes negative when the client overpays", () => {
    const payments = [makePayment(1, fromPesos(70_000), fromPesos(0))];
    expect(outstandingBalance(payments, CYCLE, price)).toBe(fromPesos(0));
  });

  it("ignores payments from another cycle", () => {
    const other = toCycleId(CLIENT, date("2026-07-01"));
    const payments = [makePayment(1, fromPesos(30_000), fromPesos(35_000))];
    expect(totalPaid(payments, other)).toBe(fromPesos(0));
  });
});

describe("payment labelling (RF-20)", () => {
  it("labels a single settling payment as full", () => {
    expect(classifyPayment(0, fromPesos(0))).toBe("full");
  });

  it("labels the first partial payment as an instalment", () => {
    expect(classifyPayment(0, fromPesos(35_000))).toBe("installment");
  });

  it("labels whichever payment clears the balance as the final one", () => {
    expect(classifyPayment(1, fromPesos(0))).toBe("finalInstallment");
    expect(classifyPayment(4, fromPesos(0))).toBe("finalInstallment");
  });

  it("numbers instalments beyond the second (RF-12 may lower the minimum)", () => {
    // The previous implementation labelled every payment after the first
    // "2do abono", so a plan with a lowered minimum produced 1st, 2nd, 2nd,
    // 2nd, final.
    const third = makePayment(3, fromPesos(10_000), fromPesos(20_000));
    expect(paymentLabel(third)).toBe("3.º abono");
  });

  it("reads the full and final labels in Spanish", () => {
    expect(
      paymentLabel(makePayment(1, fromPesos(65_000), fromPesos(0), "full")),
    ).toBe("Pago completo");
    expect(
      paymentLabel(
        makePayment(2, fromPesos(35_000), fromPesos(0), "finalInstallment"),
      ),
    ).toBe("Abono final");
  });
});

describe("checkPayment (RF-19)", () => {
  const monthly = plan("monthly");
  const fortnight = plan("fortnight");
  const price = fromPesos(65_000);

  it("rejects zero and negative amounts", () => {
    expect(checkPayment(monthly, fromPesos(0), price).accepted).toBe(false);
    expect(checkPayment(monthly, fromPesos(-1), price).accepted).toBe(false);
  });

  it("rejects more than the outstanding balance", () => {
    expect(checkPayment(monthly, fromPesos(70_000), price)).toEqual({
      accepted: false,
      reason: "exceedsBalance",
    });
  });

  it("accepts exactly the minimum instalment", () => {
    expect(checkPayment(monthly, fromPesos(30_000), price)).toEqual({
      accepted: true,
    });
  });

  it("rejects below the minimum when a balance would remain", () => {
    expect(checkPayment(monthly, fromPesos(29_999), price)).toEqual({
      accepted: false,
      reason: "belowMinimum",
    });
  });

  it("allows a small amount when it settles the balance", () => {
    // The final instalment is what is left, which may be under the minimum.
    expect(checkPayment(monthly, fromPesos(5_000), fromPesos(5_000))).toEqual({
      accepted: true,
    });
  });

  it("refuses instalments on a full-payment plan", () => {
    expect(
      checkPayment(fortnight, fromPesos(20_000), fromPesos(45_000)),
    ).toEqual({ accepted: false, reason: "installmentsNotAllowed" });
  });

  it("accepts paying a full-payment plan in one go", () => {
    expect(
      checkPayment(fortnight, fromPesos(45_000), fromPesos(45_000)),
    ).toEqual({ accepted: true });
  });
});

describe("cyclesWithBalance (RF-18)", () => {
  it("drops a cycle once a later payment settles it", () => {
    // The first instalment's snapshot still says 35.000; only the last
    // payment of the cycle says what is owed now.
    const payments = [
      makePayment(1, fromPesos(30_000), fromPesos(35_000)),
      makePayment(2, fromPesos(35_000), fromPesos(0), "finalInstallment"),
    ];
    expect(cyclesWithBalance(payments)).toEqual([]);
  });

  it("keeps a cycle that still owes, reporting the latest balance", () => {
    const payments = [
      makePayment(1, fromPesos(20_000), fromPesos(45_000)),
      makePayment(2, fromPesos(20_000), fromPesos(25_000)),
    ];
    const open = cyclesWithBalance(payments);

    expect(open).toHaveLength(1);
    expect(open[0]?.balanceAfter).toBe(fromPesos(25_000));
  });

  it("reports each cycle independently", () => {
    const other = toCycleId(CLIENT, date("2026-07-01"));
    const payments = [
      makePayment(1, fromPesos(65_000), fromPesos(0), "full"),
      {
        ...makePayment(1, fromPesos(30_000), fromPesos(35_000)),
        cycleId: other,
      },
    ];

    expect(cyclesWithBalance(payments)).toHaveLength(1);
  });
});

describe("requiresReceipt", () => {
  it("does not ask for one when the client paid cash", () => {
    expect(requiresReceipt("cash")).toBe(false);
  });

  it("asks for one on a transfer", () => {
    expect(requiresReceipt("transfer")).toBe(true);
  });

  // Cash is the ONLY method without evidence. A new one added to the catalogue
  // must decide explicitly rather than inherit whichever branch it happens to
  // fall into, so this breaks the moment one appears.
  it("exempts cash and nothing else", () => {
    const methods = Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[];
    const exempt = methods.filter((method) => !requiresReceipt(method));
    expect(exempt).toEqual(["cash"]);
  });
});
