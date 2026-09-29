"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import type { DayPass, DayPassId } from "@apexg/core";
import { PAYMENT_METHOD_LABELS, formatCOP } from "@apexg/core";
import { Card, CardBody, CardHeader, ReceiptPreview } from "@apexg/ui";

export interface DayPassListProps {
  passes: readonly DayPass[];
  receiptUrl: (id: DayPassId) => string;
}

function Row({ pass, onViewReceipt }: { pass: DayPass; onViewReceipt: () => void }) {
  return (
    <li className="flex items-center gap-3 px-2 py-3">
      <span className="w-12 shrink-0 text-sm text-body-soft">{pass.soldAt}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium text-body">{pass.visitorName}</span>
        {/* Quién lo vendió va en la misma línea, igual que en los ingresos:
            con varias recepcionistas es lo que se pregunta al cuadrar caja. */}
        <span className="block truncate text-sm text-body-soft">
          {[pass.visitorContact, PAYMENT_METHOD_LABELS[pass.paymentMethod], `vendió ${pass.recordedBy}`]
            .filter(Boolean)
            .join(" · ")}
        </span>
      </span>
      <span className="shrink-0 font-semibold text-body">{formatCOP(pass.amount)}</span>
      {pass.receiptPath ? (
        <button
          type="button"
          onClick={onViewReceipt}
          aria-label={`Ver comprobante de ${pass.visitorName}`}
          className="shrink-0 rounded-md p-1 text-body-soft hover:text-body"
        >
          <Eye size={18} />
        </button>
      ) : (
        <span className="w-[26px] shrink-0" />
      )}
    </li>
  );
}

/** Los visitantes de hoy: quién entró con pase, a qué hora y cómo pagó. */
export default function DayPassList({ passes, receiptUrl }: DayPassListProps) {
  const [open, setOpen] = useState<DayPass | null>(null);

  if (passes.length === 0) return null;

  return (
    <>
      <Card>
        <CardHeader
          title={`Pases de día · ${passes.length}`}
          description="Visitantes de hoy, sin ficha de cliente."
        />
        <CardBody padding="sm">
          <ul className="divide-y divide-line-soft">
            {passes.map((pass) => (
              <Row key={pass.id} pass={pass} onViewReceipt={() => setOpen(pass)} />
            ))}
          </ul>
        </CardBody>
      </Card>
      <ReceiptPreview
        receipt={
          open
            ? {
                url: receiptUrl(open.id),
                fileName: open.receiptPath,
                subject: `Pase de día de ${open.visitorName}`,
              }
            : null
        }
        onClose={() => setOpen(null)}
      />
    </>
  );
}
