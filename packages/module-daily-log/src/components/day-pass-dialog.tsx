"use client";

import type { DayPassProblem, PaymentMethod } from "@apexg/core";
import {
  PAYMENT_METHOD_LABELS,
  formatCOP,
  fromPesos,
  requiresReceipt,
} from "@apexg/core";
import { Button, FileInput, Input, Modal, Select } from "@apexg/ui";
import type { SelectOption } from "@apexg/ui";
import type { UseDayPassesResult } from "../hooks/use-day-passes";

const METHOD_OPTIONS: readonly SelectOption[] = (
  Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]
).map((method) => ({ value: method, label: PAYMENT_METHOD_LABELS[method] }));

const PROBLEM_TEXT: Record<DayPassProblem, string> = {
  nameRequired: "Escribe el nombre del visitante.",
  amountNotPositive: "El valor debe ser mayor que cero.",
  receiptRequired: "Adjunta la foto del comprobante de la transferencia.",
};

const problemText = (
  problems: readonly DayPassProblem[],
  problem: DayPassProblem,
) => (problems.includes(problem) ? PROBLEM_TEXT[problem] : undefined);

/** Quién es el visitante, cuánto pagó y cómo. */
function DayPassFields({ pass }: { pass: UseDayPassesResult }) {
  const { values, setValue, problems } = pass;
  return (
    <>
      <Input
        id="visitorName"
        label="Nombre"
        value={values.visitorName}
        onChange={(event) => setValue("visitorName", event.target.value)}
        error={problemText(problems, "nameRequired")}
        autoFocus
      />
      <Input
        id="dayPassAmount"
        label="Valor (COP)"
        type="number"
        min={0}
        step={1000}
        value={values.amountPesos}
        onChange={(event) => setValue("amountPesos", event.target.value)}
        error={problemText(problems, "amountNotPositive")}
      />
      <Select
        id="dayPassMethod"
        label="Método de pago"
        options={METHOD_OPTIONS}
        value={values.paymentMethod}
        onChange={(event) =>
          setValue("paymentMethod", event.target.value as PaymentMethod)
        }
      />
      {requiresReceipt(values.paymentMethod) && (
        <FileInput
          id="dayPassReceipt"
          label="Comprobante"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          hint="Captura de la transferencia. JPG, PNG, WEBP o PDF, hasta 5 MB."
          file={values.receipt}
          onChange={(file) => setValue("receipt", file)}
          error={problemText(problems, "receiptRequired")}
        />
      )}
    </>
  );
}

/** "Cobrar $6.000" cuando ya hay un valor válido; si no, solo "Cobrar". */
function submitLabel(amountPesos: string): string {
  const pesos = Number(amountPesos);
  return pesos > 0 ? `Cobrar ${formatCOP(fromPesos(pesos))}` : "Cobrar";
}

export interface DayPassDialogProps {
  open: boolean;
  onClose: () => void;
  pass: UseDayPassesResult;
}

/** Vender un día a quien no es cliente: nombre, valor, cómo pagó y su comprobante. */
export default function DayPassDialog({
  open,
  onClose,
  pass,
}: DayPassDialogProps) {
  const close = () => {
    pass.reset();
    onClose();
  };

  return (
    <Modal
      open={open}
      title="Pase de día"
      description="Para visitantes: no se registran como clientes."
      onClose={close}
    >
      <form
        noValidate
        className="space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          if (await pass.sell()) onClose();
        }}
      >
        <DayPassFields pass={pass} />
        {pass.failure && (
          <p role="alert" className="text-sm text-danger-ink">
            {pass.failure}
          </p>
        )}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={close}>
            Cancelar
          </Button>
          <Button type="submit" disabled={pass.saving}>
            {pass.saving ? "Cobrando..." : submitLabel(pass.values.amountPesos)}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
