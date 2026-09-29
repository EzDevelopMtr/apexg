import type { IsoDate } from "./calendar";
import type { Money } from "./money";
import { ZERO, add } from "./money";
import type { Payment, PaymentKind, PaymentMethod } from "./payment";

/** Tipo de pago tal como lo agrupa el filtro, en español. */
export const PAYMENT_KIND_LABELS: Record<PaymentKind, string> = {
  full: "Pago completo",
  // "Abono" a secas: el filtro junta el 1.º, el 2.º y los que sigan. Separarlos
  // por número no responde nada que alguien pregunte en el mostrador.
  installment: "Abono",
  finalInstallment: "Abono final",
};

export type ReceiptFilter = "all" | "with" | "without";

/**
 * Lo que se puede pedir sobre el listado de pagos.
 *
 * Cada campo vacío o en "all" significa "no filtrar por esto", así que el
 * filtro vacío deja pasar todo y agregar un criterio nunca obliga a llenar
 * los demás.
 */
export interface PaymentFilter {
  /** Parte del nombre del cliente. */
  readonly query: string;
  /** Desde este día, incluido. `""` = sin límite. */
  readonly from: IsoDate | "";
  /** Hasta este día, incluido. `""` = sin límite. */
  readonly to: IsoDate | "";
  readonly kind: PaymentKind | "all";
  readonly method: PaymentMethod | "all";
  /** Nombre de quien lo registró. `""` = cualquiera. */
  readonly recordedBy: string;
  readonly receipt: ReceiptFilter;
}

export const EMPTY_PAYMENT_FILTER: PaymentFilter = {
  query: "",
  from: "",
  to: "",
  kind: "all",
  method: "all",
  recordedBy: "",
  receipt: "all",
};

/**
 * Sin mayúsculas ni tildes: "perez" tiene que encontrar a "Juan Pérez".
 * La recepcionista escribe rápido y con el celular en la otra mano.
 */
function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

function matches(
  payment: Payment,
  filter: PaymentFilter,
  clientName: string,
): boolean {
  if (filter.query && !normalize(clientName).includes(normalize(filter.query))) {
    return false;
  }
  if (filter.from && payment.paidOn < filter.from) return false;
  if (filter.to && payment.paidOn > filter.to) return false;
  if (filter.kind !== "all" && payment.kind !== filter.kind) return false;
  if (filter.method !== "all" && payment.method !== filter.method) return false;
  if (filter.recordedBy && payment.recordedBy !== filter.recordedBy) {
    return false;
  }
  if (filter.receipt === "with" && !payment.receiptPath) return false;
  if (filter.receipt === "without" && payment.receiptPath) return false;
  return true;
}

/**
 * Los pagos que cumplen TODOS los criterios.
 *
 * El nombre del cliente llega por función y no dentro del pago: el pago solo
 * guarda el id, y quién lo resuelve —con qué catálogo de clientes— es
 * asunto de la pantalla.
 */
export function filterPayments(
  payments: readonly Payment[],
  filter: PaymentFilter,
  nameOf: (payment: Payment) => string,
): readonly Payment[] {
  return payments.filter((payment) => matches(payment, filter, nameOf(payment)));
}

/** Si hay algún criterio puesto, para ofrecer limpiarlos. */
export function isPaymentFilterActive(filter: PaymentFilter): boolean {
  return (Object.keys(EMPTY_PAYMENT_FILTER) as (keyof PaymentFilter)[]).some(
    (field) => filter[field] !== EMPTY_PAYMENT_FILTER[field],
  );
}

/** Lo que suman los pagos, para el resumen de lo filtrado. */
export function paymentsTotal(payments: readonly Payment[]): Money {
  return payments.reduce<Money>((running, one) => add(running, one.amount), ZERO);
}

/** Quiénes registraron pagos, sin repetir y en orden, para el selector. */
export function paymentAuthors(payments: readonly Payment[]): readonly string[] {
  return [...new Set(payments.map((payment) => payment.recordedBy))]
    .filter((name) => name !== "")
    .sort((a, b) => a.localeCompare(b, "es"));
}
