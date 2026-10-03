"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import type { IssuedCredential, NewCompany } from "@apexg/core";
import { isAllowedBrandColor, isHexColor } from "@apexg/core";

const EMPTY = {
  name: "",
  slug: "",
  adminUsername: "",
  adminFullName: "",
  brandColor: "#306e9d",
};
export type CompanyFormValues = typeof EMPTY;

/** "Gimnasio Ñandú Fit" → "gimnasio-nandu-fit": a starting point, still editable. */
export function suggestSlug(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

/** Only what the form can know; the backend re-checks all of it. */
function problem(values: CompanyFormValues): string | null {
  if (values.name.trim().length < 2) return "Escribe el nombre del gimnasio.";
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(values.slug) || values.slug.length < 3) {
    return "El identificador: minúsculas, dígitos y guiones, mínimo 3 caracteres.";
  }
  if (values.adminUsername.trim().length < 3)
    return "El usuario del administrador necesita al menos 3 caracteres.";
  if (values.adminFullName.trim().length < 2)
    return "Escribe el nombre del administrador.";
  if (
    !isHexColor(values.brandColor) ||
    !isAllowedBrandColor(values.brandColor)
  ) {
    return "Rojo, naranja, ámbar y verde son de los estados del cliente: elige otro color.";
  }
  return null;
}

export function useCompanyForm(
  create: (company: NewCompany) => Promise<IssuedCredential>,
  onCreated: (credential: IssuedCredential, slug: string) => void,
) {
  const [values, setValues] = useState<CompanyFormValues>(EMPTY);
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const set = (field: keyof CompanyFormValues, value: string) =>
    setValues((current) => ({
      ...current,
      [field]: value,
      ...(field === "name" && !slugTouched ? { slug: suggestSlug(value) } : {}),
    }));

  const setSlug = (value: string) => {
    setSlugTouched(true);
    set("slug", value);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const found = problem(values);
    if (found) return setError(found);
    setSubmitting(true);
    try {
      onCreated(
        await create({ ...values, name: values.name.trim() }),
        values.slug,
      );
      setValues(EMPTY);
      setSlugTouched(false);
      setError(null);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudo crear el gimnasio.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return { values, set, setSlug, error, submitting, submit };
}
