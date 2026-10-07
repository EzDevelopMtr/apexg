"use client";

import { Check, Plus } from "lucide-react";
import type { PlatformCompany } from "@apexg/core";
import { materialButton } from "@apexg/ui";
import { useGymUsers } from "../hooks/use-gym-users";
import type { Notify } from "../hooks/use-toast";
import { useUsersSection } from "../hooks/use-users-section";
import { usePlatformLinks } from "../platform-context";
import CredentialCard from "./credential-card";
import NewUserForm from "./new-user-form";
import { isAdminRole } from "./role-copy";
import Section from "./section";
import UserRow from "./user-row";

export interface UsersSectionProps {
  readonly company: PlatformCompany;
  readonly notify: Notify;
  /** The gym list behind the sheet shows a user count: it reloads after each change. */
  readonly onChanged: () => void;
}

/** Who signs in at this gym, and with which profile. Changes apply at once. */
export default function UsersSection({ company, notify, onChanged }: UsersSectionProps) {
  const gymUsers = useGymUsers(company.id, notify, onChanged);
  const view = useUsersSection(gymUsers, notify);
  const link = usePlatformLinks().gymLink(company.slug);
  const active = gymUsers.users.filter((u) => u.active);
  const admins = active.filter((u) => isAdminRole(u.roleName)).length;

  return (
    <Section
      title="Usuarios"
      help={<>Entran desde <span className="font-mono">/{company.slug}</span> con su usuario y contraseña. Estos cambios se aplican al instante; no esperan a «Guardar cambios».</>}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">{active.length} {active.length === 1 ? "usuario activo" : "usuarios activos"}</div>
          <div className="text-xs text-body-faint">
            {admins} {admins === 1 ? "administrador" : "administradores"} · {active.length - admins} con otro perfil
          </div>
        </div>
        {!view.creating && (
          <button type="button" onClick={view.startCreating} disabled={gymUsers.roles.length === 0} className={materialButton("tinted", "sm")}>
            <Plus size={15} /> Nuevo usuario
          </button>
        )}
      </div>

      {view.creating && (
        <NewUserForm
          roles={gymUsers.roles}
          takenUsernames={gymUsers.users.map((u) => u.username)}
          gymPath={`/${company.slug}`}
          create={gymUsers.create}
          onCreated={view.onCreated}
          onCancel={view.cancelCreating}
        />
      )}
      {view.created && (
        <div className="mb-3">
          <p className="flex items-center gap-2 text-[13px] font-semibold text-brand-ink">
            <Check size={16} /> {view.created.fullName} ya puede entrar.
          </p>
          <CredentialCard credential={view.created.credential} link={link} recipient={`a ${view.created.fullName}`} />
        </div>
      )}

      {gymUsers.error && <p role="alert" className="text-sm text-danger-ink">{gymUsers.error}</p>}
      <div className="overflow-hidden rounded-xl bg-fill-1">
        {gymUsers.loading && <p className="p-3 text-sm text-body-soft">Cargando usuarios…</p>}
        {gymUsers.users.map((user, index) => (
          <div key={user.id} className={index > 0 ? "border-t border-hairline" : ""}>
            <UserRow
              user={user}
              roles={gymUsers.roles}
              open={view.expanded === user.id}
              onToggle={() => view.toggle(user.id)}
              lastAdmin={view.lastAdmin(user)}
              credential={view.revealed[user.id]}
              link={link}
              actions={{
                setRole: (role) => view.setRole(user, role),
                setActive: (on) => void gymUsers.setActive(user, on),
                resetPassword: () => void view.resetPassword(user),
              }}
            />
          </div>
        ))}
      </div>
    </Section>
  );
}
