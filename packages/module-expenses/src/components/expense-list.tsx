"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import type { Expense, ExpenseCategory, ExpenseId } from "@apexg/core";
import { PAYMENT_METHOD_LABELS, findCategory, formatCOP } from "@apexg/core";
import {
  Card,
  ReceiptPreview,
  Table,
  TableCell,
  TableEmpty,
  TableRow,
} from "@apexg/ui";

const HEADERS = [
  "Concepto",
  "Categoría",
  "Valor",
  "Fecha",
  "Forma de pago",
  "Registró",
] as const;

export interface ExpenseListProps {
  expenses: readonly Expense[];
  categories: readonly ExpenseCategory[];
  receiptUrl: (id: ExpenseId) => string;
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

export default function ExpenseList({
  expenses,
  categories,
  receiptUrl,
}: ExpenseListProps) {
  const [open, setOpen] = useState<Expense | null>(null);

  return (
    <>
      <Card className="overflow-hidden">
        <Table headers={HEADERS}>
          {expenses.length === 0 ? (
            <TableEmpty
              columns={HEADERS.length}
              message="No hay egresos registrados."
            />
          ) : (
            expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell>
                  <p className="font-semibold text-body">
                    {expense.description}
                  </p>
                </TableCell>
                <TableCell className="text-sm">
                  {findCategory(categories, expense.categoryId)?.name ??
                    "Sin categoría"}
                </TableCell>
                <TableCell className="font-semibold">
                  {formatCOP(expense.amount)}
                </TableCell>
                <TableCell className="text-sm">{expense.spentOn}</TableCell>
                <MethodCell expense={expense} onView={() => setOpen(expense)} />
                <TableCell className="text-sm">{expense.recordedBy}</TableCell>
              </TableRow>
            ))
          )}
        </Table>
      </Card>
      <ReceiptPreview
        receipt={
          open
            ? {
                url: receiptUrl(open.id),
                fileName: open.receiptPath,
                subject: `Egreso: ${open.description}`,
              }
            : null
        }
        onClose={() => setOpen(null)}
      />
    </>
  );
}
