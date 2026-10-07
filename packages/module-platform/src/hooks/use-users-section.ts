"use client";

import { useState } from "react";
import type { IssuedCredential, PlatformRole, PlatformUser } from "@apexg/core";
import { isLastAdministrator } from "@apexg/core";
import type { CreatedUser } from "./use-new-user-form";
import type { useGymUsers } from "./use-gym-users";
import type { Notify } from "./use-toast";

type GymUsers = ReturnType<typeof useGymUsers>;

/**
 * What the users section shows: which row is open, whether the new-user form
 * is out, and the credentials revealed this time (gone once the sheet closes).
 */
export function useUsersSection(gymUsers: GymUsers, notify: Notify) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<CreatedUser | null>(null);
  const [revealed, setRevealed] = useState<Record<string, IssuedCredential>>({});

  const toggle = (id: string) => setExpanded((current) => (current === id ? null : id));

  const startCreating = () => {
    setCreated(null);
    setCreating(true);
  };

  const onCreated = (user: CreatedUser) => {
    setCreating(false);
    setCreated(user);
  };

  const lastAdmin = (user: PlatformUser) => isLastAdministrator(user, gymUsers.users);

  const setRole = (user: PlatformUser, role: PlatformRole) => {
    if (role.id === user.roleId) return;
    // The server refuses it too; saying so here keeps the thumb from jumping.
    if (lastAdmin(user)) return notify("Debe quedar al menos un administrador activo");
    void gymUsers.setRole(user, role);
  };

  const resetPassword = async (user: PlatformUser) => {
    try {
      const credential = await gymUsers.resetPassword(user);
      setRevealed((current) => ({ ...current, [user.id]: credential }));
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : "No se pudo restablecer la contraseña.");
    }
  };

  return {
    expanded,
    toggle,
    creating,
    startCreating,
    cancelCreating: () => setCreating(false),
    created,
    onCreated,
    revealed,
    lastAdmin,
    setRole,
    resetPassword,
  };
}
