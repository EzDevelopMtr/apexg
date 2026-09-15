"use client";

import { useCallback, useMemo, useState } from "react";
import type {
  Client,
  ClientDraft,
  ClientStatus,
  MembershipType,
  MembershipTypeId,
  Trainer,
  TrainerId,
} from "@apexg/core";
import {
  calculateExpirationDate,
  isIsoDate,
  requiresTrainer,
  today,
  toMembershipTypeId,
  toTrainerId,
} from "@apexg/core";
import type { Collection } from "@apexg/module-kit";
import { useCollection, useMembershipTypeCatalog, useRepositories } from "@apexg/module-kit";

export interface ClientFormValues {
  fullName: string;
  idNumber: string;
  phone: string;
  email: string;
  membershipTypeId: MembershipTypeId;
  status: ClientStatus;
  startDate: string;
  /** Empty string when no trainer is picked yet — required only for RF-24 plans. */
  trainerId: TrainerId | "";
}

export type ClientFormErrors = Partial<Record<keyof ClientFormValues, string>>;

function initialValues(client?: Client): ClientFormValues {
  return {
    fullName: client?.fullName ?? "",
    idNumber: client?.idNumber ?? "",
    phone: client?.phone ?? "",
    email: client?.email ?? "",
    // Left blank rather than defaulted to a guessed plan: the real catalogue
    // is fetched asynchronously, so there is nothing sensible to default to
    // before it loads. The Select shows a placeholder until the user picks.
    membershipTypeId: client?.membershipTypeId ?? toMembershipTypeId(""),
    status: client?.status ?? "active",
    // RF-06: defaults to today, but stays editable for a membership that
    // started on a different day.
    startDate: client?.startDate ?? today(),
    trainerId: client?.trainerId ?? toTrainerId(""),
  };
}

function validate(
  values: ClientFormValues,
  membershipTypes: readonly MembershipType[],
): ClientFormErrors {
  const errors: ClientFormErrors = {};

  if (!values.fullName.trim()) errors.fullName = "Ingresa el nombre completo.";
  if (!values.idNumber.trim()) errors.idNumber = "Ingresa el documento.";
  if (!values.phone.trim()) errors.phone = "Ingresa el teléfono.";
  if (values.email && !values.email.includes("@")) {
    errors.email = "El correo no es válido.";
  }
  if (!isIsoDate(values.startDate)) {
    errors.startDate = "Selecciona una fecha de inicio válida.";
  }
  if (!values.membershipTypeId.trim()) {
    errors.membershipTypeId = "Selecciona un tipo de membresía.";
  }

  // RF-24: personal and semi-personal plans need a trainer on record.
  const type = membershipTypes.find((item) => item.id === values.membershipTypeId);
  if (type && requiresTrainer(type) && !values.trainerId.trim()) {
    errors.trainerId = "Selecciona un entrenador.";
  }

  return errors;
}

export interface UseClientFormResult {
  readonly values: ClientFormValues;
  readonly errors: ClientFormErrors;
  /** Expiration derived from start date and plan (RF-07). Read-only for the user. */
  readonly expirationPreview: string | null;
  /** The real catalogue (RF-13), for the plan `<Select>` — see `useMembershipTypeCatalog`. */
  readonly membershipTypes: Collection<MembershipType>;
  /** Trainers on staff (RF-22), for the `<Select>` the personal plans need (RF-24). */
  readonly trainers: Collection<Trainer>;
  readonly setValue: <K extends keyof ClientFormValues>(
    field: K,
    value: ClientFormValues[K],
  ) => void;
  /** Returns the draft when valid, or `null` after publishing the errors. */
  readonly submit: () => ClientDraft | null;
}

export function useClientForm(client?: Client): UseClientFormResult {
  const [values, setValues] = useState<ClientFormValues>(() =>
    initialValues(client),
  );
  const [errors, setErrors] = useState<ClientFormErrors>({});
  const membershipTypes = useMembershipTypeCatalog();
  const { trainers: trainerRepository } = useRepositories();
  const loadTrainers = useCallback(
    () => trainerRepository.list(),
    [trainerRepository],
  );
  const trainers = useCollection<Trainer>(loadTrainers);

  const setValue = useCallback(
    <K extends keyof ClientFormValues>(
      field: K,
      value: ClientFormValues[K],
    ) => {
      setValues((current) => ({ ...current, [field]: value }));
      setErrors((current) => ({ ...current, [field]: undefined }));
    },
    [],
  );

  const expirationPreview = useMemo(() => {
    const type = membershipTypes.items.find((item) => item.id === values.membershipTypeId);
    if (!type || !isIsoDate(values.startDate)) return null;
    return calculateExpirationDate(values.startDate, type.term);
  }, [membershipTypes.items, values.membershipTypeId, values.startDate]);

  const submit = useCallback((): ClientDraft | null => {
    const found = validate(values, membershipTypes.items);
    setErrors(found);
    if (Object.keys(found).length > 0) return null;

    // Safe: validate() rejected anything that is not an IsoDate.
    const startDate = values.startDate;
    if (!isIsoDate(startDate)) return null;

    // A trainer only travels with the draft when the chosen plan needs one
    // (RF-24) — switching away from a personal plan drops a stale pick.
    const type = membershipTypes.items.find(
      (item) => item.id === values.membershipTypeId,
    );
    const trainerId =
      type && requiresTrainer(type) && values.trainerId
        ? values.trainerId
        : undefined;

    return {
      fullName: values.fullName.trim(),
      idNumber: values.idNumber.trim(),
      phone: values.phone.trim(),
      email: values.email.trim(),
      membershipTypeId: values.membershipTypeId,
      status: values.status,
      startDate,
      trainerId,
    };
  }, [values, membershipTypes.items]);

  return {
    values,
    errors,
    expirationPreview,
    membershipTypes,
    trainers,
    setValue,
    submit,
  };
}
