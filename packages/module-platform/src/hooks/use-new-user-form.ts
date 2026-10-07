"use client";

import { useState } from "react";
import type { IssuedCredential, NewPlatformUser, PlatformRole } from "@apexg/core";
import { ROLE_LABELS, suggestUsername, usernameProblem } from "@apexg/core";
import { USERNAME_PROBLEM_TEXT } from "../gym-rules";

export interface CreatedUser {
  readonly fullName: string;
  readonly credential: IssuedCredential;
}

/**
 * One new user. The username follows the name until edited; the profile
 * starts on the least powerful one, so giving admin rights is a choice.
 */
export function useNewUserForm(
  roles: readonly PlatformRole[],
  takenUsernames: readonly string[],
  create: (input: NewPlatformUser) => Promise<IssuedCredential>,
  onCreated: (user: CreatedUser) => void,
) {
  const [fullName, setFullName] = useState("");
  const [username, setUsernameState] = useState("");
  const [touched, setTouched] = useState(false);
  const [roleId, setRoleId] = useState<number | undefined>(
    (roles.find((role) => role.name !== ROLE_LABELS.admin) ?? roles[0])?.id,
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const issue = usernameProblem(username, takenUsernames);

  const setName = (value: string) => {
    setFullName(value);
    if (!touched) setUsernameState(suggestUsername(value));
  };

  const setUsername = (value: string) => {
    setTouched(true);
    setUsernameState(value.trim().toLowerCase());
  };

  const submit = async () => {
    if (fullName.trim().length < 2) return setError("Escribe el nombre completo.");
    if (issue) return setError(USERNAME_PROBLEM_TEXT[issue]);
    if (roleId === undefined) return setError("Elige un perfil.");
    setSubmitting(true);
    setError(null);
    try {
      const credential = await create({ fullName: fullName.trim(), username, roleId });
      onCreated({ fullName: fullName.trim(), credential });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo crear el usuario.");
    } finally {
      setSubmitting(false);
    }
  };

  return {
    fullName,
    setName,
    username,
    setUsername,
    usernameProblem: username && issue ? USERNAME_PROBLEM_TEXT[issue] : null,
    roleId,
    setRoleId,
    error,
    submitting,
    submit,
  };
}
