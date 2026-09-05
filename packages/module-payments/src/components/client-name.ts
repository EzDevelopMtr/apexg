import type { Client, Payment } from "@apexg/core";

/** Looks up a display name for a payment's client. */
export function clientNameOf(
  clients: readonly Client[],
  payment: Payment,
): string {
  return (
    clients.find((client) => client.id === payment.clientId)?.fullName ??
    "Cliente retirado"
  );
}
