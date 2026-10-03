"use client";

import { useState } from "react";
import type { CompanyChange, IssuedCredential, PlatformCompany } from "@apexg/core";

export interface CompanyActions {
  update: (id: string, change: CompanyChange) => Promise<void>;
  uploadLogo: (id: string, logo: Blob) => Promise<void>;
  resetPassword: (id: string) => Promise<IssuedCredential>;
}

/** Edits one gym. Every action reports back through `error` or `notice`. */
export function useCompanyEditor(company: PlatformCompany, actions: CompanyActions) {
  const [name, setName] = useState(company.name);
  const [slug, setSlug] = useState(company.slug);
  const [color, setColor] = useState(company.brandColor ?? "#306e9d");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [credential, setCredential] = useState<IssuedCredential | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async (action: () => Promise<void>, done: string) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await action();
      setNotice(done);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo guardar.");
    } finally {
      setBusy(false);
    }
  };

  const save = () => {
    const change: CompanyChange = {
      ...(name.trim() !== company.name ? { name: name.trim() } : {}),
      ...(slug !== company.slug ? { slug } : {}),
      ...(color !== company.brandColor ? { brandColor: color } : {}),
    };
    if (Object.keys(change).length === 0) return setNotice("No hay cambios.");
    return run(() => actions.update(company.id, change), "Cambios guardados.");
  };

  const toggleStatus = () =>
    run(
      () =>
        actions.update(company.id, {
          status: company.status === "active" ? "suspended" : "active",
        }),
      company.status === "active" ? "Gimnasio suspendido." : "Gimnasio reactivado.",
    );

  const resetColor = () => run(() => actions.update(company.id, { brandColor: null }), "Colores por defecto.");

  const uploadLogo = (file: Blob) => run(() => actions.uploadLogo(company.id, file), "Logo actualizado.");

  const resetPassword = () =>
    run(async () => setCredential(await actions.resetPassword(company.id)), "Contraseña restablecida.");

  return {
    fields: { name, setName, slug, setSlug, color, setColor },
    save,
    toggleStatus,
    resetColor,
    uploadLogo,
    resetPassword,
    credential,
    error,
    notice,
    busy,
  };
}
