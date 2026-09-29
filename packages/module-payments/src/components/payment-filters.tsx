"use client";

import { Search, X } from "lucide-react";
import type {
  IsoDate,
  PaymentKind,
  PaymentMethod,
  ReceiptFilter,
} from "@apexg/core";
import {
  PAYMENT_KIND_LABELS,
  PAYMENT_METHOD_LABELS,
  formatCOP,
} from "@apexg/core";
import { Button, Card, CardBody, Input, Select } from "@apexg/ui";
import type { SelectOption } from "@apexg/ui";
import type { UsePaymentFilterResult } from "../hooks/use-payment-filter";

const ALL = { value: "all", label: "Todos" } as const;

const KIND_OPTIONS: readonly SelectOption[] = [
  ALL,
  ...(Object.keys(PAYMENT_KIND_LABELS) as PaymentKind[]).map((kind) => ({
    value: kind,
    label: PAYMENT_KIND_LABELS[kind],
  })),
];

const METHOD_OPTIONS: readonly SelectOption[] = [
  ALL,
  ...(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((method) => ({
    value: method,
    label: PAYMENT_METHOD_LABELS[method],
  })),
];

const RECEIPT_OPTIONS: readonly SelectOption[] = [
  ALL,
  { value: "with", label: "Con comprobante" },
  { value: "without", label: "Sin comprobante" },
];

export interface PaymentFiltersProps {
  filters: UsePaymentFilterResult;
}

/** Un campo por columna de la tabla: fechas, tipo, método, autor, comprobante. */
function ColumnFilters({ filters }: PaymentFiltersProps) {
  const { filter, setField, authors } = filters;
  const authorOptions: readonly SelectOption[] = [
    { value: "", label: "Todos" },
    ...authors.map((name) => ({ value: name, label: name })),
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
      <Input
        id="paymentFrom"
        label="Desde"
        type="date"
        value={filter.from}
        max={filter.to || undefined}
        onChange={(event) =>
          setField("from", event.target.value as IsoDate | "")
        }
      />
      <Input
        id="paymentTo"
        label="Hasta"
        type="date"
        value={filter.to}
        min={filter.from || undefined}
        onChange={(event) =>
          setField("to", event.target.value as IsoDate | "")
        }
      />
      <Select
        id="paymentKind"
        label="Tipo"
        value={filter.kind}
        options={KIND_OPTIONS}
        onChange={(event) =>
          setField("kind", event.target.value as PaymentKind | "all")
        }
      />
      <Select
        id="paymentMethod"
        label="Método"
        value={filter.method}
        options={METHOD_OPTIONS}
        onChange={(event) =>
          setField("method", event.target.value as PaymentMethod | "all")
        }
      />
      <Select
        id="paymentAuthor"
        label="Registró"
        value={filter.recordedBy}
        options={authorOptions}
        onChange={(event) => setField("recordedBy", event.target.value)}
      />
      <Select
        id="paymentReceipt"
        label="Comprobante"
        value={filter.receipt}
        options={RECEIPT_OPTIONS}
        onChange={(event) =>
          setField("receipt", event.target.value as ReceiptFilter)
        }
      />
    </div>
  );
}

/**
 * Los filtros por columna de la tabla de pagos, y cuánto suma lo que queda.
 *
 * El total es la razón de ser de la mitad de estas búsquedas: "¿cuánto entró
 * por transferencia esta semana?" se responde leyendo una cifra, no sumando
 * filas a mano.
 */
export default function PaymentFilters({ filters }: PaymentFiltersProps) {
  const { filter, setField, reset, visible, active, total } = filters;

  return (
    <Card className="mb-4">
      <CardBody className="space-y-4">
        <Input
          id="paymentQuery"
          aria-label="Buscar por cliente"
          icon={<Search size={20} />}
          placeholder="Buscar por cliente..."
          value={filter.query}
          onChange={(event) => setField("query", event.target.value)}
        />

        <ColumnFilters filters={filters} />

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-soft pt-4">
          {/* aria-live: al cambiar un filtro, el lector de pantalla anuncia
              el nuevo resultado sin que haya que ir a buscarlo. */}
          <p className="text-sm text-body-soft" aria-live="polite">
            <span className="font-semibold text-body">{visible.length}</span>{" "}
            {visible.length === 1 ? "pago" : "pagos"} · Total{" "}
            <span className="font-semibold text-body">{formatCOP(total)}</span>
          </p>
          {active && (
            <Button variant="ghost" size="sm" onClick={reset}>
              <X size={16} />
              Limpiar filtros
            </Button>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
