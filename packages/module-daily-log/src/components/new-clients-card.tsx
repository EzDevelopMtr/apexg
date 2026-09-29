"use client";

import type { Client, IsoDate, MembershipType, Payment } from "@apexg/core";
import { PAYMENT_METHOD_LABELS } from "@apexg/core";
import { Card, CardBody, CardHeader } from "@apexg/ui";

/**
 * Cuántas personas se ven antes de que la lista se desplace.
 *
 * Cada fila tiene altura fija (`ROW`) para que el tope sea exactamente cinco
 * filas: con altura libre, un nombre largo que parte en dos líneas dejaría la
 * quinta cortada a la mitad.
 */
const VISIBLE_ROWS = 5;
const ROW = "h-[4.5rem]";
const MAX_HEIGHT = "max-h-[22.5rem]";

/** Clients registered today, with their plan and how they paid (RF-34). */
export default function NewClientsCard({
  clients,
  payments,
  membershipTypes,
  on,
}: {
  clients: readonly Client[];
  payments: readonly Payment[];
  membershipTypes: readonly MembershipType[];
  on: IsoDate;
}) {
  return (
    <Card>
      <CardHeader
        title={clients.length > 0 ? `Clientes nuevos · ${clients.length}` : "Clientes nuevos"}
        description="Registrados hoy, con su plan y forma de pago."
      />
      <CardBody>
        {clients.length === 0 ? (
          <p className="text-body-faint">Ningún cliente nuevo hoy.</p>
        ) : (
          <ul
            className={`divide-y divide-line-soft ${
              clients.length > VISIBLE_ROWS ? `${MAX_HEIGHT} overflow-y-auto pr-2` : ""
            }`}
            // Enfocable cuando se desplaza: sin esto, quien usa teclado no
            // tiene cómo llegar a los que quedan abajo.
            tabIndex={clients.length > VISIBLE_ROWS ? 0 : undefined}
            aria-label="Clientes nuevos de hoy"
          >
            {clients.map((client) => {
              const payment = payments.find(
                (item) => item.clientId === client.id && item.paidOn === on,
              );
              const plan = membershipTypes.find(
                (type) => type.id === client.membershipTypeId,
              );

              return (
                <li
                  key={client.id}
                  className={`flex ${ROW} flex-col justify-center`}
                >
                  <p className="truncate font-semibold text-body">{client.fullName}</p>
                  <p className="truncate text-sm text-body-soft">
                    {client.phone} · {plan?.name ?? client.membershipTypeId}
                    {payment && ` · ${PAYMENT_METHOD_LABELS[payment.method]}`}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
        {clients.length > VISIBLE_ROWS && (
          <p className="mt-3 text-xs text-body-faint">
            Desliza la lista para ver los {clients.length - VISIBLE_ROWS} restantes.
          </p>
        )}
      </CardBody>
    </Card>
  );
}
