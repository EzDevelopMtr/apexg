"use client";

import type { ExpenseCategory, IsoDate } from "@apexg/core";
import { activeCategories } from "@apexg/core";
import { Input, Select, Textarea } from "@apexg/ui";

export interface ExpenseFieldsValues {
  categoryId: string;
  description: string;
  amountPesos: string;
  spentOn: string;
}

export interface ExpenseFieldsProps {
  values: ExpenseFieldsValues;
  categories: readonly ExpenseCategory[];
  setValue: <K extends keyof ExpenseFieldsValues>(
    field: K,
    value: ExpenseFieldsValues[K],
  ) => void;
}

/** The fields of an expense (RF-26). Retired categories are not offered. */
export default function ExpenseFields({
  values,
  categories,
  setValue,
}: ExpenseFieldsProps) {
  const options = activeCategories(categories).map((category) => ({
    value: category.id,
    label: category.name,
  }));

  return (
    <>
      <Select
        id="categoryId"
        label="Categoría"
        value={values.categoryId}
        options={options}
        placeholder="Selecciona una categoría"
        onChange={(event) => setValue("categoryId", event.target.value)}
      />

      <Textarea
        id="description"
        label="Concepto / justificación"
        value={values.description}
        onChange={(event) => setValue("description", event.target.value)}
        placeholder="Ej. Nómina mes de septiembre"
      />

      <div className="grid gap-5 md:grid-cols-2">
        <Input
          id="amountPesos"
          label="Valor (COP)"
          type="number"
          min={0}
          step={1000}
          value={values.amountPesos}
          onChange={(event) => setValue("amountPesos", event.target.value)}
        />
        <Input
          id="spentOn"
          label="Fecha"
          type="date"
          value={values.spentOn}
          onChange={(event) =>
            setValue("spentOn", event.target.value as IsoDate)
          }
        />
      </div>
    </>
  );
}
