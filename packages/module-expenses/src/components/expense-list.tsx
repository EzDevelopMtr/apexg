"use client";

import type { Expense, ExpenseCategory } from "@apexg/core";
import { findCategory, formatCOP } from "@apexg/core";
import { Card, Table, TableCell, TableEmpty, TableRow } from "@apexg/ui";

const HEADERS = [
  "Concepto",
  "Categoría",
  "Valor",
  "Fecha",
  "Registró",
] as const;

export interface ExpenseListProps {
  expenses: readonly Expense[];
  categories: readonly ExpenseCategory[];
}

export default function ExpenseList({
  expenses,
  categories,
}: ExpenseListProps) {
  return (
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
                <p className="font-semibold text-slate-900">
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
              <TableCell className="text-sm">{expense.recordedBy}</TableCell>
            </TableRow>
          ))
        )}
      </Table>
    </Card>
  );
}
