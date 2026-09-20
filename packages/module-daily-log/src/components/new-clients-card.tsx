"use client";

import type { Client, IsoDate, MembershipType, Payment } from "@apexg/core";
import { PAYMENT_METHOD_LABELS } from "@apexg/core";
import { Card, CardBody, CardHeader } from "@apexg/ui";

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
        title="Clientes nuevos"
        description="Registrados hoy, con su plan y forma de pago."
      />
      <CardBody>
        {clients.length === 0 ? (
          <p className="text-body-faint">Ningún cliente nuevo hoy.</p>
        ) : (
          <ul className="divide-y divide-line-soft">
            {clients.map((client) => {
              const payment = payments.find(
                (item) => item.clientId === client.id && item.paidOn === on,
              );
              const plan = membershipTypes.find(
                (type) => type.id === client.membershipTypeId,
              );

              return (
                <li key={client.id} className="py-3">
                  <p className="font-semibold text-body">{client.fullName}</p>
                  <p className="text-sm text-body-soft">
                    {client.phone} · {plan?.name ?? client.membershipTypeId}
                    {payment && ` · ${PAYMENT_METHOD_LABELS[payment.method]}`}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
