"use client";

import { Pencil, UserRound } from "lucide-react";
import type { Client, IsoDate } from "@apexg/core";
import { findMembershipType, resolveStatus } from "@apexg/core";
import { Badge, Button, TableCell, TableRow } from "@apexg/ui";
import { STATUS_LABELS, STATUS_TONES } from "./client-status";

export interface ClientRowProps {
  client: Client;
  referenceDate: IsoDate;
  onEdit: (client: Client) => void;
}

export default function ClientRow({
  client,
  referenceDate,
  onEdit,
}: ClientRowProps) {
  // Derived rather than read from the record, so the row cannot show "active"
  // for a membership that lapsed overnight (RF-21).
  const status = resolveStatus(client, referenceDate);
  const membership = findMembershipType(client.membershipTypeId);

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft text-brand-ink">
            <UserRound size={19} />
          </div>
          <div>
            <p className="font-semibold text-body">{client.fullName}</p>
            <p className="text-sm text-body-soft">{client.email}</p>
          </div>
        </div>
      </TableCell>

      <TableCell className="text-sm">{client.idNumber}</TableCell>
      <TableCell className="text-sm">{client.phone}</TableCell>
      <TableCell className="text-sm">
        {membership?.name ?? client.membershipTypeId}
      </TableCell>

      <TableCell>
        <Badge tone={STATUS_TONES[status]}>{STATUS_LABELS[status]}</Badge>
      </TableCell>

      <TableCell className="text-sm">{client.expirationDate}</TableCell>

      <TableCell className="text-right">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(client)}
          aria-label={`Editar a ${client.fullName}`}
          title="Editar cliente"
        >
          <Pencil size={17} />
        </Button>
      </TableCell>
    </TableRow>
  );
}
