"use client";

import type { Client, ClientStanding, IsoDate, ReminderRecord } from "@apexg/core";
import { reminderNotice, renewalReminder, whatsAppLink } from "@apexg/core";
import { TableCell, useBrand } from "@apexg/ui";
import ReminderLink from "./reminder-link";

export interface ClientPhoneCellProps {
  client: Client;
  standing: ClientStanding;
  planName: string;
  referenceDate: IsoDate;
  lastReminder: ReminderRecord | undefined;
  onRemind: () => void;
}

/** The phone, and the renewal reminder when there is a renewal to ask for. */
export default function ClientPhoneCell({
  client,
  standing,
  planName,
  referenceDate,
  lastReminder,
  onRemind,
}: ClientPhoneCellProps) {
  const gymName = useBrand().name;
  // Only those with a renewal pending get the reminder: an active client has
  // nothing to renew, and a retired one already left.
  const pending = standing === "expiringSoon" || standing === "overdue";

  return (
    <TableCell className="text-sm">
      <p>{client.phone}</p>
      {pending && (
        <ReminderLink
          href={whatsAppLink(
            client.phone,
            renewalReminder(
              { fullName: client.fullName, planName, gymName, expirationDate: client.expirationDate },
              referenceDate,
            ),
          )}
          clientName={client.fullName}
          notice={lastReminder && reminderNotice(lastReminder.sentOn, referenceDate)}
          sentByName={lastReminder?.sentByName}
          onOpen={onRemind}
        />
      )}
    </TableCell>
  );
}
