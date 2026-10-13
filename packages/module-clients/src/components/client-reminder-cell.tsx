"use client";

import type { Client, ClientStanding, IsoDate, ReminderRecord, ReminderTemplates } from "@apexg/core";
import { reminderNotice, renewalReminder, whatsAppLink } from "@apexg/core";
import { TableCell, useBrand } from "@apexg/ui";
import ReminderLink from "./reminder-link";

/** One client's reminder state, already bound to that client. */
export interface RowReminder {
  readonly last: ReminderRecord | undefined;
  /** Opening the chat records it (the link cannot tell whether it was sent). */
  readonly onOpen: () => void;
}

export interface ClientReminderCellProps {
  client: Client;
  standing: ClientStanding;
  planName: string;
  referenceDate: IsoDate;
  /** The gym's own wording. */
  templates: ReminderTemplates;
  reminder: RowReminder;
}

/** The renewal reminder, when there is a renewal to ask for. */
export default function ClientReminderCell({
  client,
  standing,
  planName,
  referenceDate,
  templates,
  reminder,
}: ClientReminderCellProps) {
  const gymName = useBrand().name;
  // Only those with a renewal pending get the reminder: an active client has
  // nothing to renew, and a retired one already left.
  const pending = standing === "expiringSoon" || standing === "overdue";
  if (!pending) return <TableCell>{null}</TableCell>;

  const { last } = reminder;
  return (
    <TableCell className="text-center text-sm">
      <ReminderLink
        href={whatsAppLink(
          client.phone,
          renewalReminder(
            { fullName: client.fullName, planName, gymName, expirationDate: client.expirationDate },
            referenceDate,
            templates,
          ),
        )}
        clientName={client.fullName}
        onOpen={reminder.onOpen}
      />
      {last && (
        <p className="mt-0.5 text-xs text-body-soft" title={last.sentByName ? `Por ${last.sentByName}` : undefined}>
          {reminderNotice(last.sentOn, referenceDate)}
        </p>
      )}
    </TableCell>
  );
}
