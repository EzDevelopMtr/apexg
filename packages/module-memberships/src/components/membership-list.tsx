"use client";

import type { MembershipType } from "@apexg/core";
import { Card, Table, TableEmpty } from "@apexg/ui";
import MembershipRow from "./membership-row";

const HEADERS = [
  "Plan",
  "Valor",
  "Vigencia",
  "Abono mínimo",
  "Condiciones",
  "Acción",
] as const;

export interface MembershipListProps {
  types: readonly MembershipType[];
  onEdit?: (type: MembershipType) => void;
}

export default function MembershipList({ types, onEdit }: MembershipListProps) {
  return (
    <Card className="overflow-hidden">
      <Table headers={HEADERS}>
        {types.length === 0 ? (
          <TableEmpty
            columns={HEADERS.length}
            message="No hay planes que mostrar."
          />
        ) : (
          types.map((type) => (
            <MembershipRow key={type.id} type={type} onEdit={onEdit} />
          ))
        )}
      </Table>
    </Card>
  );
}
