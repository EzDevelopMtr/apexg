import type { Client, LedgerEntry, Payment } from "@apexg/core";

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

/** Who a row of the list is for: the client, or the visitor of a day pass. */
export function entryNameOf(
  clients: readonly Client[],
  entry: LedgerEntry,
): string {
  return entry.kind === "dayPass"
    ? entry.pass.visitorName
    : clientNameOf(clients, entry.payment);
}
