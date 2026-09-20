import type { Commission, IsoDate, Payment } from "@apexg/core";
import {
  fromPesos,
  toClientId,
  toCycleId,
  toMembershipTypeId,
  toPaymentId,
  toTrainerId,
} from "@apexg/core";

/** Test data used while there is no backend. Not shipped to production. */

const day = (value: string) => value as IsoDate;

export function buildSeedPayments(): Payment[] {
  const juan = toClientId("client-1");
  const laura = toClientId("client-2");
  const carlos = toClientId("client-3");

  return [
    {
      id: toPaymentId("payment-1"),
      clientId: juan,
      cycleId: toCycleId(juan, day("2026-08-15")),
      membershipTypeId: toMembershipTypeId("monthly"),
      agreedPrice: fromPesos(65_000),
      amount: fromPesos(65_000),
      balanceAfter: fromPesos(0),
      kind: "full",
      sequence: 1,
      paidOn: day("2026-08-15"),
      method: "transfer",
      receiptPath: "",
      recordedBy: "apexg",
      notes: "Pago confirmado por transferencia.",
    },
    {
      id: toPaymentId("payment-2"),
      clientId: laura,
      cycleId: toCycleId(laura, day("2026-09-01")),
      membershipTypeId: toMembershipTypeId("personalTraining"),
      agreedPrice: fromPesos(200_000),
      amount: fromPesos(100_000),
      balanceAfter: fromPesos(100_000),
      kind: "installment",
      sequence: 1,
      paidOn: day("2026-09-01"),
      method: "transfer",
      receiptPath: "",
      recordedBy: "apexg",
      notes: "Primer abono del plan personalizado.",
    },
    {
      id: toPaymentId("payment-3"),
      clientId: carlos,
      cycleId: toCycleId(carlos, day("2026-08-10")),
      membershipTypeId: toMembershipTypeId("monthlyThreeDays"),
      agreedPrice: fromPesos(50_000),
      amount: fromPesos(30_000),
      balanceAfter: fromPesos(20_000),
      kind: "installment",
      sequence: 1,
      paidOn: day("2026-08-10"),
      method: "cash",
      receiptPath: "",
      recordedBy: "apexg",
      notes: "Quedó saldo pendiente.",
    },
  ];
}

export function buildSeedCommissions(): Commission[] {
  return [
    {
      id: "commission-1",
      trainerId: toTrainerId("trainer-1"),
      paymentId: toPaymentId("payment-2"),
      clientId: toClientId("client-2"),
      // SRS §4.4: the personal plan splits 100/100.
      amount: fromPesos(50_000),
      earnedOn: day("2026-09-01"),
      settled: false,
    },
  ];
}
