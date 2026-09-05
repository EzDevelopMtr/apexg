"use client";

import { fromPesos, toPesos } from "@apexg/core";
import { Input } from "@apexg/ui";
import type { MembershipFieldsProps } from "./membership-fields";

/**
 * Price and minimum instalment (SRS §4.1, §4.3).
 *
 * Amounts are entered in pesos and stored as cents: `fromPesos` is the only
 * place that conversion happens, so no component handles a raw amount.
 */
export default function MembershipPricingFields({
  draft,
  update,
}: MembershipFieldsProps) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <Input
        id="price"
        label="Valor (COP)"
        type="number"
        min={0}
        step={1000}
        value={toPesos(draft.price)}
        onChange={(event) =>
          update("price", fromPesos(Number(event.target.value)))
        }
      />
      <Input
        id="minimumInstallment"
        label="Abono mínimo (vacío = pago completo)"
        type="number"
        min={0}
        step={1000}
        value={
          draft.minimumInstallment === null
            ? ""
            : toPesos(draft.minimumInstallment)
        }
        onChange={(event) =>
          update(
            "minimumInstallment",
            event.target.value === ""
              ? null
              : fromPesos(Number(event.target.value)),
          )
        }
      />
    </div>
  );
}
