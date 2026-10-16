"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import type {
  CommissionPayout,
  Expense,
  ExpenseCategory,
  ExpenseId,
  OutgoingEntry,
  TrainerId,
} from "@apexg/core";
import { PAYMENT_METHOD_LABELS, findCategory, formatCOP } from "@apexg/core";
import {
  Card,
  ReceiptPreview,
  Table,
  TableCell,
  TableEmpty,
  TableRow,
} from "@apexg/ui";
import PayoutRow from "./payout-row";

const HEADERS = [
  "Concepto",
  "Categoría",
  "Valor",
  "Fecha",
  "Forma de pago",
  "Registró",
] as const;

export interface ExpenseListProps {
  entries: readonly OutgoingEntry[];
  categories: readonly ExpenseCategory[];
  receiptUrl: (id: ExpenseId) => string;
  payoutReceiptUrl: (payout: CommissionPayout) => string;
  trainerName: (id: TrainerId) => string;
}

/** What the preview needs, resolved once when the eye is clicked. */
interface OpenReceipt {
  url: string;
  fileName: string;
  subject: string;
}

function MethodCell({
  expense,
  onView,
}: {
  expense: Expense;
  onView: () => void;
}) {
  return (
    <TableCell className="text-sm">
      <span className="flex items-center gap-2">
        {/* "—" en los egresos anteriores a la migración 019: no se sabe. */}
        {expense.paymentMethod
          ? PAYMENT_METHOD_LABELS[expense.paymentMethod]
          : "—"}
        {expense.receiptPath && (
          <button
            type="button"
            onClick={onView}
            aria-label={`Ver comprobante de ${expense.description}`}
            className="rounded-md p-1 text-body-soft hover:text-body"
          >
            <Eye size={18} />
          </button>
        )}
      </span>
    </TableCell>
  );
}

function ExpenseRow({
  expense,
  categories,
  onView,
}: {
  expense: Expense;
  categories: readonly ExpenseCategory[];
  onView: () => void;
}) {
  return (
    <TableRow>
      <TableCell>
        <p className="font-semibold text-body">{expense.description}</p>
      </TableCell>
      <TableCell className="text-sm">
        {findCategory(categories, expense.categoryId)?.name ?? "Sin categoría"}
      </TableCell>
      <TableCell className="font-semibold">{formatCOP(expense.amount)}</TableCell>
      <TableCell className="text-sm">{expense.spentOn}</TableCell>
      <MethodCell expense={expense} onView={onView} />
      <TableCell className="text-sm">{expense.recordedBy}</TableCell>
    </TableRow>
  );
}

export default function ExpenseList({
  entries,
  categories,
  receiptUrl,
  payoutReceiptUrl,
  trainerName,
}: ExpenseListProps) {
  const [open, setOpen] = useState<OpenReceipt | null>(null);

  return (
    <>
      <Card className="overflow-hidden">
        <Table headers={HEADERS}>
          {entries.length === 0 ? (
            <TableEmpty
              columns={HEADERS.length}
              message="No hay egresos registrados."
            />
          ) : (
            entries.map((entry) => {
              if (entry.kind === "commissions") {
                const { payout } = entry;
                const name = trainerName(payout.trainerId);
                return (
                  <PayoutRow
                    key={entry.id}
                    payout={payout}
                    trainerName={name}
                    onViewReceipt={() =>
                      setOpen({
                        url: payoutReceiptUrl(payout),
                        fileName: payout.receiptPath,
                        subject: `Pago de comisiones a ${name}`,
                      })
                    }
                  />
                );
              }
              const { expense } = entry;
              return (
                <ExpenseRow
                  key={entry.id}
                  expense={expense}
                  categories={categories}
                  onView={() =>
                    setOpen({
                      url: receiptUrl(expense.id),
                      fileName: expense.receiptPath,
                      subject: `Egreso: ${expense.description}`,
                    })
                  }
                />
              );
            })
          )}
        </Table>
      </Card>
      <ReceiptPreview receipt={open} onClose={() => setOpen(null)} />
    </>
  );
}
