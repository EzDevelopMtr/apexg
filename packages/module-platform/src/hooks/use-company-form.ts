"use client";

import { useState } from "react";
import type { CreatedCompany, IssuedCredential, NewCompany, SlugProblem, UsernameProblem } from "@apexg/core";
import { isAllowedBrandColor, isHexColor, slugProblem, suggestSlug, usernameProblem } from "@apexg/core";
import { SLUG_PROBLEM_TEXT, USERNAME_PROBLEM_TEXT } from "../gym-rules";
import { useLogoDraft } from "./use-logo-draft";

const EMPTY = { name: "", slug: "", adminUsername: "", adminFullName: "" };
export type CompanyFormValues = typeof EMPTY;

export interface CreatorActions {
  readonly create: (company: NewCompany) => Promise<CreatedCompany>;
  readonly uploadLogo: (id: string, logo: Blob) => Promise<void>;
}

export interface CreatedGym {
  readonly name: string;
  readonly slug: string;
  readonly color: string | null;
  readonly credential: IssuedCredential;
  readonly logoSrc?: string;
  /** Why the logo did not go up. The gym exists anyway: the logo can follow from "Editar". */
  readonly logoFailed: string | null;
}

const COLOR_REFUSED = "Rojo, naranja, ámbar y verde son de los estados del cliente: elige otro tono.";

function firstProblem(values: CompanyFormValues, slug: SlugProblem | null, username: UsernameProblem | null) {
  if (values.name.trim().length < 2) return "Escribe el nombre del gimnasio.";
  if (slug) return `Dirección: ${SLUG_PROBLEM_TEXT[slug]}`;
  if (username) return `Usuario del administrador: ${USERNAME_PROBLEM_TEXT[username]}`;
  if (values.adminFullName.trim().length < 2) return "Escribe el nombre del administrador.";
  return null;
}

/** `null` once the logo is up, else why not. Never throws: the gym is already created. */
async function uploadAfterCreate(upload: CreatorActions["uploadLogo"], id: string, file: File | null) {
  if (!file) return null;
  try {
    await upload(id, file);
    return null;
  } catch (cause) {
    return cause instanceof Error ? cause.message : "No se pudo subir el logo.";
  }
}

/** New gym: identity, brand and first administrator. The address follows the name until edited. */
export function useCompanyForm(actions: CreatorActions, takenSlugs: readonly string[]) {
  const [values, setValues] = useState<CompanyFormValues>(EMPTY);
  const [color, setColor] = useState<string | null>("#0e9aa7");
  const [colorProblem, setColorProblem] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<CreatedGym | null>(null);
  const logo = useLogoDraft();

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

  const submit = async () => {
    const problem = firstProblem(values, slugIssue, usernameIssue);
    if (problem) return setError(problem);
    setSubmitting(true);
    setError(null);
    try {
      const name = values.name.trim();
      const { id, credential } = await actions.create({
        name,
        slug: values.slug,
        adminUsername: values.adminUsername.trim(),
        adminFullName: values.adminFullName.trim(),
        ...(color ? { brandColor: color } : {}),
      });
      const logoFailed = await uploadAfterCreate(actions.uploadLogo, id, logo.file);
      setCreated({ name, slug: values.slug, color, credential, logoSrc: logoFailed ? undefined : logo.preview, logoFailed });
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
    logo,
    slugProblem: values.slug && slugIssue ? SLUG_PROBLEM_TEXT[slugIssue] : null,
    error,
    submitting,
    submit,
    created,
  };
}
