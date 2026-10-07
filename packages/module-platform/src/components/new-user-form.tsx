"use client";

import { KeyRound } from "lucide-react";
import type { IssuedCredential, NewPlatformUser, PlatformRole } from "@apexg/core";
import { materialButton } from "@apexg/ui";
import type { CreatedUser } from "../hooks/use-new-user-form";
import { useNewUserForm } from "../hooks/use-new-user-form";
import RolePicker from "./role-picker";
import TextField from "./text-field";

export interface NewUserFormProps {
  readonly roles: readonly PlatformRole[];
  readonly takenUsernames: readonly string[];
  readonly gymPath: string;
  readonly create: (input: NewPlatformUser) => Promise<IssuedCredential>;
  readonly onCreated: (user: CreatedUser) => void;
  readonly onCancel: () => void;
}

/** One more person for this gym. The password is generated on create and shown once. */
export default function NewUserForm({ roles, takenUsernames, gymPath, create, onCreated, onCancel }: NewUserFormProps) {
  const form = useNewUserForm(roles, takenUsernames, create, onCreated);
  return (
    <div className="mb-3 animate-materialize rounded-xl bg-fill-1 p-3.5 shadow-[inset_0_0_0_1px_var(--color-hairline)] motion-reduce:animate-none">
      <TextField id="new-user-name" label="Nombre completo" value={form.fullName} onChange={form.setName} placeholder="Nombre y apellido" />
      <TextField
        id="new-user-username"
        label="Usuario"
        value={form.username}
        onChange={form.setUsername}
        prefix="@"
        mono
        placeholder="recepcion.tarde"
        error={form.usernameProblem}
        hint={`Con este usuario entra en ${gymPath}.`}
      />
      <div className="mt-3">
        <RolePicker roles={roles} value={form.roleId} onChange={(role) => form.setRoleId(role.id)} />
      </div>
      <p className="mt-2.5 flex items-center gap-1.5 text-xs text-body-faint">
        <KeyRound size={13} /> La contraseña se genera al crearlo y se muestra una sola vez.
      </p>
      {form.error && (
        <p role="alert" className="mt-2 text-xs text-danger-ink">
          {form.error}
        </p>
      )}
      <div className="mt-3 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className={materialButton("plain", "sm")}>
          Cancelar
        </button>
        <button type="button" onClick={() => void form.submit()} disabled={form.submitting} className={materialButton("primary", "sm")}>
          {form.submitting ? "Creando…" : "Crear usuario"}
        </button>
      </div>
    </div>
  );
}
