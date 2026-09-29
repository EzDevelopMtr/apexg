"use client";

import type { DayPassProblem, PaymentMethod } from "@apexg/core";
import { PAYMENT_METHOD_LABELS, formatCOP, requiresReceipt } from "@apexg/core";
import { Button, FileInput, Input, Modal, Select } from "@apexg/ui";
import type { SelectOption } from "@apexg/ui";
import type { UseDayPassesResult } from "../hooks/use-day-passes";

const METHOD_OPTIONS: readonly SelectOption[] = (
  Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]
).map((method) => ({ value: method, label: PAYMENT_METHOD_LABELS[method] }));

const PROBLEM_TEXT: Record<DayPassProblem, string> = {
  nameRequired: "Escribe el nombre del visitante.",
  receiptRequired: "Adjunta la foto del comprobante de la transferencia.",
};

const problemText = (
  problems: readonly DayPassProblem[],
  problem: DayPassProblem,
) => (problems.includes(problem) ? PROBLEM_TEXT[problem] : undefined);

/** Quién es el visitante y cómo pagó. */
function DayPassFields({ pass }: { pass: UseDayPassesResult }) {
  const { values, setValue, problems, frequent } = pass;
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
        id="visitorContact"
        label="Documento o teléfono (opcional)"
        value={values.visitorContact}
        onChange={(event) => setValue("visitorContact", event.target.value)}
      />
      {frequent && (
        <p className="rounded-xl border border-line bg-canvas p-3 text-sm text-body">
          Ya compró {frequent.earlierPasses} pases este mes. {frequent.plan.name} (
          {formatCOP(frequent.plan.price)}) puede salirle mejor.
        </p>
      )}
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

export interface DayPassDialogProps {
  open: boolean;
  onClose: () => void;
  pass: UseDayPassesResult;
}

/** Vender un día a quien no es cliente: nombre, cómo pagó y su comprobante. */
export default function DayPassDialog({ open, onClose, pass }: DayPassDialogProps) {
  const { plan } = pass;

  const close = () => {
    pass.reset();
    onClose();
  };

  return (
    <Modal
      open={open}
      title="Pase de día"
      description={
        plan
          ? `${plan.name} · ${formatCOP(plan.price)}. Sin registrar al visitante como cliente.`
          : undefined
      }
      onClose={close}
    >
      {!plan ? (
        <p role="alert" className="text-sm text-danger-ink">
          {pass.plansLoaded
            ? "No hay un plan de un día en el catálogo. Créalo en Membresías para vender pases."
            : "Cargando el precio del día..."}
        </p>
      ) : (
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
              {pass.saving ? "Cobrando..." : `Cobrar ${formatCOP(plan.price)}`}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
