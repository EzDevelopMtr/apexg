import type { IsoDate } from "./calendar";
import type { DayPass } from "./day-pass";
import type { Money } from "./money";
import type { Payment, PaymentKind, PaymentMethod } from "./payment";

/** Lo que distingue una fila del listado de Pagos: el tipo de pago, o un pase. */
export type LedgerKind = PaymentKind | "dayPass";

/** Lo que toda fila del listado tiene en común, sea abono o pase. */
interface LedgerFields {
  readonly id: string;
  readonly paidOn: IsoDate;
  readonly amount: Money;
  readonly method: PaymentMethod;
  readonly recordedBy: string;
  readonly receiptPath: string;
}

/**
 * Una fila del listado de Pagos.
 *
 * Los pases de día son plata cobrada igual que una mensualidad, así que
 * aparecen donde se mira lo cobrado; el tipo dice cuál es cuál. Siguen siendo
 * entidades aparte: un pase no tiene ciclo, saldo ni cliente detrás.
 */
export type LedgerEntry =
  | (LedgerFields & { readonly kind: PaymentKind; readonly payment: Payment })
  | (LedgerFields & { readonly kind: "dayPass"; readonly pass: DayPass });

/** Los pagos y los pases en un solo listado, con la misma forma. */
export function ledgerOf(
  payments: readonly Payment[],
  passes: readonly DayPass[],
): readonly LedgerEntry[] {
  return [
    ...payments.map(
      (payment): LedgerEntry => ({
        id: payment.id,
        kind: payment.kind,
        paidOn: payment.paidOn,
        amount: payment.amount,
        method: payment.method,
        recordedBy: payment.recordedBy,
        receiptPath: payment.receiptPath,
        payment,
      }),
    ),
    ...passes.map(
      (pass): LedgerEntry => ({
        id: pass.id,
        kind: "dayPass",
        paidOn: pass.soldOn,
        amount: pass.amount,
        method: pass.paymentMethod,
        recordedBy: pass.recordedBy,
        receiptPath: pass.receiptPath,
        pass,
      }),
    ),
  ];
}
