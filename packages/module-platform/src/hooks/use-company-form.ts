"use client";

import { useState } from "react";
import type { IssuedCredential, NewCompany } from "@apexg/core";
import { isAllowedBrandColor, isHexColor, slugProblem, suggestSlug, usernameProblem } from "@apexg/core";
import { SLUG_PROBLEM_TEXT, USERNAME_PROBLEM_TEXT } from "../gym-rules";

const EMPTY = { name: "", slug: "", adminUsername: "", adminFullName: "" };
export type CompanyFormValues = typeof EMPTY;

export interface CreatedGym {
  readonly name: string;
  readonly slug: string;
  readonly color: string | null;
  readonly credential: IssuedCredential;
}

const COLOR_REFUSED = "Rojo, naranja, ámbar y verde son de los estados del cliente: elige otro tono.";

/** New gym: identity, colour and first administrator. The address follows the name until edited. */
export function useCompanyForm(
  create: (company: NewCompany) => Promise<IssuedCredential>,
  takenSlugs: readonly string[],
) {
  const [values, setValues] = useState<CompanyFormValues>(EMPTY);
  const [color, setColor] = useState<string | null>("#0e9aa7");
  const [colorProblem, setColorProblem] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<CreatedGym | null>(null);

  const slugIssue = slugProblem(values.slug, takenSlugs);
  const usernameIssue = usernameProblem(values.adminUsername.trim().toLowerCase(), []);

  const set = (field: keyof CompanyFormValues, value: string) =>
    setValues((current) => ({
      ...current,
      [field]: field === "slug" || field === "adminUsername" ? value.toLowerCase() : value,
      ...(field === "name" && !slugTouched ? { slug: suggestSlug(value) } : {}),
    }));

  const setSlug = (value: string) => {
    setSlugTouched(true);
    set("slug", value);
  };

  const pickColor = (next: string | null) => {
    if (next !== null && !(isHexColor(next) && isAllowedBrandColor(next))) return setColorProblem(COLOR_REFUSED);
    setColorProblem(null);
    setColor(next);
  };

  const firstProblem = (): string | null => {
    if (values.name.trim().length < 2) return "Escribe el nombre del gimnasio.";
    if (slugIssue) return `Dirección: ${SLUG_PROBLEM_TEXT[slugIssue]}`;
    if (usernameIssue) return `Usuario del administrador: ${USERNAME_PROBLEM_TEXT[usernameIssue]}`;
    if (values.adminFullName.trim().length < 2) return "Escribe el nombre del administrador.";
    return null;
  };

  const submit = async () => {
    const problem = firstProblem();
    if (problem) return setError(problem);
    setSubmitting(true);
    setError(null);
    try {
      const credential = await create({
        name: values.name.trim(),
        slug: values.slug,
        adminUsername: values.adminUsername.trim(),
        adminFullName: values.adminFullName.trim(),
        ...(color ? { brandColor: color } : {}),
      });
      setCreated({ name: values.name.trim(), slug: values.slug, color, credential });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo crear el gimnasio.");
    } finally {
      setSubmitting(false);
    }
  };

  return {
    values,
    set,
    setSlug,
    color,
    pickColor,
    colorProblem,
    slugProblem: values.slug && slugIssue ? SLUG_PROBLEM_TEXT[slugIssue] : null,
    error,
    submitting,
    submit,
    created,
  };
}
