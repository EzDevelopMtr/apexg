"use client";

import { BLOOD_TYPES } from "@apexg/core";
import { FileInput, Input, Select, Textarea, type SelectOption } from "@apexg/ui";
import type { UseClientFormResult } from "../hooks/use-client-form";

type Props = Pick<UseClientFormResult, "values" | "errors" | "setValue">;

const BLOOD_TYPE_OPTIONS: readonly SelectOption[] = [
  { value: "", label: "No especifica" },
  ...BLOOD_TYPES.map((type) => ({ value: type, label: type })),
];

/**
 * The fields the database already had room for but the form never asked:
 * emergency contact, blood type, birth date and medical condition. All
 * optional on the backend — none of these block saving the client.
 *
 * No "Comentarios" box. The column and the form value both stay, so editing
 * a client keeps whatever was already stored there rather than blanking it;
 * it is only no longer asked for.
 */
export default function ClientAdditionalFields({
  values,
  errors,
  setValue,
}: Props) {
  return (
    <>
      <div className="grid gap-5 md:grid-cols-2">
        <Input
          id="emergencyContactName"
          label="Contacto de emergencia"
          value={values.emergencyContactName}
          error={errors.emergencyContactName}
          onChange={(event) =>
            setValue("emergencyContactName", event.target.value)
          }
          placeholder="Nombre de a quién avisar"
        />
        <Input
          id="emergencyContactPhone"
          label="Teléfono de emergencia"
          type="tel"
          value={values.emergencyContactPhone}
          error={errors.emergencyContactPhone}
          onChange={(event) =>
            setValue("emergencyContactPhone", event.target.value)
          }
          placeholder="300 000 0000"
        />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Select
          id="bloodType"
          label="Tipo de sangre"
          value={values.bloodType}
          options={BLOOD_TYPE_OPTIONS}
          onChange={(event) => setValue("bloodType", event.target.value)}
        />
        <Input
          id="birthDate"
          label="Fecha de nacimiento"
          type="date"
          value={values.birthDate}
          error={errors.birthDate}
          onChange={(event) => setValue("birthDate", event.target.value)}
        />
      </div>

      {/* En el mostrador se reconoce a la gente por la cara, no por el
          documento. Opcional: la mayoría de los clientes viejos no tiene, y
          eso no es un dato faltante que haya que perseguir. */}
      <FileInput
        id="photo"
        label="Foto (opcional)"
        accept="image/jpeg,image/png,image/webp"
        hint="Se ve en la lista y al registrar el ingreso. JPG, PNG o WEBP, hasta 2 MB."
        file={values.photo}
        onChange={(file) => setValue("photo", file)}
      />

      <Textarea
        id="medicalCondition"
        label="Condición médica"
        value={values.medicalCondition}
        onChange={(event) => setValue("medicalCondition", event.target.value)}
        placeholder="Ej. Asma, alergias, lesiones a tener en cuenta"
      />
    </>
  );
}
