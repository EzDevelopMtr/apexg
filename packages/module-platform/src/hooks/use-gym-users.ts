"use client";

// Fetching on mount is a legitimate effect.
// oxlint-disable react/set-state-in-effect

import { useCallback, useEffect, useState } from "react";
import type { IssuedCredential, NewPlatformUser, PlatformRole, PlatformUser } from "@apexg/core";
import { usePlatformRepository } from "../platform-context";
import type { Notify } from "./use-toast";

/**
 * The people who sign in at one gym. Changes apply at once — they are not
 * part of the sheet's "Guardar cambios" — and each one offers an undo.
 */
export function useGymUsers(companyId: string, notify: Notify, onChanged: () => void) {
  const repository = usePlatformRepository();
  const [users, setUsers] = useState<readonly PlatformUser[]>([]);
  const [roles, setRoles] = useState<readonly PlatformRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const [nextUsers, nextRoles] = await Promise.all([
        repository.listUsers(companyId),
        repository.listRoles(companyId),
      ]);
      setUsers(nextUsers);
      setRoles(nextRoles);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos cargar los usuarios.");
    } finally {
      setLoading(false);
    }
  }, [repository, companyId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  /** Every write reloads this list and the gym counts behind the sheet. */
  const write = useCallback(
    async (action: () => Promise<void>, message: string, undo?: () => Promise<void>) => {
      try {
        await action();
        notify(message, undo && (() => undo().then(reload).then(onChanged)));
      } catch (cause) {
        notify(cause instanceof Error ? cause.message : "No se pudo guardar.");
      }
      await reload();
      onChanged();
    },
    [notify, reload, onChanged],
  );

  const create = async (input: NewPlatformUser): Promise<IssuedCredential> => {
    const { credential } = await repository.createUser(companyId, input);
    await reload();
    onChanged();
    return credential;
  };

  const setRole = (user: PlatformUser, role: PlatformRole) =>
    write(
      () => repository.updateUser(companyId, user.id, { roleId: role.id }),
      `${user.fullName}: ${role.name}`,
      () => repository.updateUser(companyId, user.id, { roleId: user.roleId }),
    );

  const setActive = (user: PlatformUser, active: boolean) =>
    write(
      () => repository.updateUser(companyId, user.id, { active }),
      active ? `${user.fullName} puede volver a entrar` : `${user.fullName} ya no puede entrar`,
      () => repository.updateUser(companyId, user.id, { active: !active }),
    );

  const resetPassword = (user: PlatformUser) => repository.resetUserPassword(companyId, user.id);

  return { users, roles, loading, error, create, setRole, setActive, resetPassword };
}
