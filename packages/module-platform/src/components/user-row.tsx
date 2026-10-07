"use client";

import { ChevronRight, KeyRound, Lock } from "lucide-react";
import type { IssuedCredential, PlatformRole, PlatformUser } from "@apexg/core";
import { materialButton } from "@apexg/ui";
import { initials } from "../gym-rules";
import CredentialCard from "./credential-card";
import { isAdminRole } from "./role-copy";
import RolePicker from "./role-picker";

export interface UserRowProps {
  readonly user: PlatformUser;
  readonly roles: readonly PlatformRole[];
  readonly open: boolean;
  readonly onToggle: () => void;
  /** The gym's only active administrator: the guard is shown, not just enforced. */
  readonly lastAdmin: boolean;
  readonly credential?: IssuedCredential;
  readonly link: string;
  readonly actions: {
    readonly setRole: (role: PlatformRole) => void;
    readonly setActive: (active: boolean) => void;
    readonly resetPassword: () => void;
  };
}

/** One user. Its details open in place, growing down from the row that was tapped. */
export default function UserRow({ user, roles, open, onToggle, lastAdmin, credential, link, actions }: UserRowProps) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="grid w-full grid-cols-[32px_minmax(0,1fr)_auto_16px] items-center gap-3 px-3 py-2.5 text-left transition-[background-color,transform] duration-100 ease-out hover:bg-fill-1 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-ink active:scale-[0.995] active:bg-fill-2"
      >
        <span aria-hidden className={`grid size-8 place-items-center rounded-full bg-fill-3 text-xs font-bold text-body-muted ${user.active ? "" : "opacity-50"}`}>
          {initials(user.fullName)}
        </span>
        <span className={`flex min-w-0 flex-col ${user.active ? "" : "opacity-50"}`}>
          <span className="truncate text-sm font-semibold">{user.fullName}</span>
          <span className="font-mono text-xs text-body-faint">
            @{user.username}
            {user.active ? "" : " · desactivado"}
          </span>
        </span>
        <span className={`whitespace-nowrap rounded-full px-2.5 py-[3px] text-xs font-semibold ${isAdminRole(user.roleName) ? "bg-brand-soft text-brand-ink" : "bg-fill-2 text-body-muted"} ${user.active ? "" : "opacity-50"}`}>
          {user.roleName}
        </span>
        <ChevronRight size={16} aria-hidden className={`text-body-faint transition-transform duration-450 ease-spring-fast ${open ? "rotate-90" : ""}`} />
      </button>
      <div className={`grid transition-[grid-template-rows] duration-600 ease-spring motion-reduce:transition-none ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="min-h-0 overflow-hidden" inert={!open}>
          <div className="px-3 pb-3.5 pt-0.5 md:pl-14">
            <RolePicker roles={roles} value={user.roleId} onChange={actions.setRole} />
            {lastAdmin && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-body-soft">
                <Lock size={13} /> Es el único administrador activo: crea otro antes de cambiarle el perfil o desactivarlo.
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" disabled={!user.active} onClick={actions.resetPassword} className={materialButton("tinted", "sm")}>
                <KeyRound size={15} /> Restablecer contraseña
              </button>
              <button type="button" disabled={lastAdmin} onClick={() => actions.setActive(!user.active)} className={materialButton(user.active ? "destructive" : "tinted", "sm")}>
                {user.active ? "Desactivar" : "Reactivar"}
              </button>
            </div>
            {credential && <CredentialCard credential={credential} link={link} recipient={`a ${user.fullName}`} />}
          </div>
        </div>
      </div>
    </div>
  );
}
