"use client";

import { Input } from "@apexg/ui";
import type { UseClientFormResult } from "../hooks/use-client-form";

type Props = Pick<UseClientFormResult, "values" | "errors" | "setValue">;

/** Identity and contact details (RF-04). */
export default function ClientContactFields({
  values,
  errors,
  setValue,
}: Props) {
  return (
    <>
      <Input
        id="fullName"
        label="Nombre completo"
        value={values.fullName}
        error={errors.fullName}
        onChange={(event) => setValue("fullName", event.target.value)}
        placeholder="Ej. Juan Pérez"
      />

      <div className="grid gap-5 md:grid-cols-2">
        <Input
          id="idNumber"
          label="Documento"
          value={values.idNumber}
          error={errors.idNumber}
          onChange={(event) => setValue("idNumber", event.target.value)}
          placeholder="Número de documento"
        />
        <Input
          id="phone"
          label="Teléfono"
          type="tel"
          value={values.phone}
          error={errors.phone}
          onChange={(event) => setValue("phone", event.target.value)}
          placeholder="300 000 0000"
        />
      </div>

      <Input
        id="email"
        label="Correo electrónico"
        type="email"
        value={values.email}
        error={errors.email}
        onChange={(event) => setValue("email", event.target.value)}
        placeholder="cliente@email.com"
      />
    </>
  );
}
