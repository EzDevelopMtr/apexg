"use client";

import { useState } from "react";
import type { CompanyChange, PlatformCompany } from "@apexg/core";
import { isAllowedBrandColor, isHexColor, slugProblem } from "@apexg/core";
import { SLUG_PROBLEM_TEXT } from "../gym-rules";
import { useLogoPicker } from "./use-logo-picker";
import type { Notify } from "./use-toast";

export interface CompanyActions {
  update: (id: string, change: CompanyChange) => Promise<void>;
  uploadLogo: (id: string, logo: Blob) => Promise<void>;
}

const COLOR_REFUSED = "Rojo, naranja, ámbar y verde son de los estados del cliente: elige otro tono.";

/**
 * Edits one gym. Name, address and colour wait for "Guardar cambios"; the
 * logo and the suspension apply at once, each with an undo where it can have one.
 */
export function useCompanyEditor(
  company: PlatformCompany,
  takenSlugs: readonly string[],
  actions: CompanyActions,
  notify: Notify,
) {
  const [name, setName] = useState(company.name);
  const [slug, setSlugState] = useState(company.slug);
  const [color, setColor] = useState<string | null>(company.brandColor);
  const [colorProblem, setColorProblem] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const slugIssue = slugProblem(slug, takenSlugs);

  const run = async (action: () => Promise<void>): Promise<boolean> => {
    setBusy(true);
    setError(null);
    try {
      await action();
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo guardar.");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const pickColor = (next: string | null) => {
    if (next !== null && !(isHexColor(next) && isAllowedBrandColor(next))) return setColorProblem(COLOR_REFUSED);
    setColorProblem(null);
    setColor(next);
  };

  /** Resolves true when the sheet may close. */
  const save = async (): Promise<boolean> => {
    if (slugIssue) return false;
    const change: CompanyChange = {
      ...(name.trim() !== company.name ? { name: name.trim() } : {}),
      ...(slug !== company.slug ? { slug } : {}),
      ...(color !== company.brandColor ? { brandColor: color } : {}),
    };
    if (Object.keys(change).length === 0) return true;
    const before: CompanyChange = { name: company.name, slug: company.slug, brandColor: company.brandColor };
    const ok = await run(() => actions.update(company.id, change));
    if (ok) notify(`${name.trim()} actualizado`, () => actions.update(company.id, before));
    return ok;
  };

  const toggleStatus = async (): Promise<boolean> => {
    const next = company.status === "active" ? "suspended" : "active";
    const ok = await run(() => actions.update(company.id, { status: next }));
    if (ok) {
      notify(next === "suspended" ? `${company.name} suspendido` : `${company.name} reactivado`, () =>
        actions.update(company.id, { status: company.status }),
      );
    }
    return ok;
  };

  const logo = useLogoPicker(async (file) => {
    const ok = await run(() => actions.uploadLogo(company.id, file));
    if (ok) notify("Logo actualizado");
    return ok;
  });

  return {
    fields: { name, setName, slug, setSlug: (value: string) => setSlugState(value.toLowerCase()), color, pickColor },
    slugProblem: slugIssue ? SLUG_PROBLEM_TEXT[slugIssue] : null,
    colorProblem,
    error,
    busy,
    save,
    toggleStatus,
    logo,
  };
}
