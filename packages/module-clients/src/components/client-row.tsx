"use client";

import { Pencil } from "lucide-react";
import type { Client, IsoDate, MembershipType } from "@apexg/core";
import { expiryNotice, resolveStanding } from "@apexg/core";
import { Avatar, Badge, Button, TableCell, TableRow } from "@apexg/ui";
import { STANDING_LABELS, STANDING_TONES } from "./client-status";

export interface ClientRowProps {
  client: Client;
  referenceDate: IsoDate;
  /** `undefined` while the catalogue is still loading, or if the plan was since removed. */
  membershipType: MembershipType | undefined;
  /** Dónde está su foto. `undefined` si no tiene. */
  photoUrl: string | undefined;
  onEdit: (client: Client) => void;
  onOpenPhoto: () => void;
}

export default function ClientRow({
  client,
  referenceDate,
  membershipType,
  photoUrl,
  onEdit,
  onOpenPhoto,
}: ClientRowProps) {
  // Derived rather than read from the record, so the row cannot show "active"
  // for a membership that lapsed overnight (RF-21).
  const standing = resolveStanding(client, referenceDate);
  const soon = standing === "expiringSoon";

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar
            name={client.fullName}
            photoUrl={photoUrl}
            onOpen={onOpenPhoto}
          />
          <div>
            <p className="font-semibold text-body">{client.fullName}</p>
            <p className="text-sm text-body-soft">{client.email}</p>
          </div>
        </div>
      </TableCell>

      <TableCell className="text-sm">{client.idNumber}</TableCell>
      <TableCell className="text-sm">{client.phone}</TableCell>
      <TableCell className="text-sm">
        {membershipType?.name ?? client.membershipTypeId}
      </TableCell>

      <TableCell>
        <Badge tone={STANDING_TONES[standing]}>
          {STANDING_LABELS[standing]}
        </Badge>
      </TableCell>

      <TableCell className="text-sm">
        {/* La fecha sola no dice nada a quien no lleva el calendario en la
            cabeza: al lado va cuánto falta, y en ámbar cuando urge. */}
        <p className={soon ? "font-semibold text-warn-ink" : "text-body"}>
          {client.expirationDate}
        </p>
        {soon && (
          <p className="text-warn-ink">{expiryNotice(client, referenceDate)}</p>
        )}
      </TableCell>

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
