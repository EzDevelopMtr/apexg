"use client";

import { useCallback, useMemo, useState } from "react";
import type {
  Client,
  ClientDraft,
  ClientStatus,
  MembershipTypeId,
} from "@apexg/core";
import {
  calculateExpirationDate,
  findMembershipType,
  isIsoDate,
  isMembershipTypeId,
  today,
} from "@apexg/core";

export interface ClientFormValues {
  fullName: string;
  idNumber: string;
  phone: string;
  email: string;
  membershipTypeId: MembershipTypeId;
  status: ClientStatus;
  startDate: string;
}

export type ClientFormErrors = Partial<Record<keyof ClientFormValues, string>>;

function initialValues(client?: Client): ClientFormValues {
  return {
    fullName: client?.fullName ?? "",
    idNumber: client?.idNumber ?? "",
    phone: client?.phone ?? "",
    email: client?.email ?? "",
    membershipTypeId: client?.membershipTypeId ?? "monthly",
    status: client?.status ?? "active",
    // RF-06: defaults to today, but stays editable for a membership that
    // started on a different day.
    startDate: client?.startDate ?? today(),
  };
}

function validate(values: ClientFormValues): ClientFormErrors {
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
  if (!isMembershipTypeId(values.membershipTypeId)) {
    errors.membershipTypeId = "Selecciona un tipo de membresía.";
  }

  return errors;
}

export interface UseClientFormResult {
  readonly values: ClientFormValues;
  readonly errors: ClientFormErrors;
  /** Expiration derived from start date and plan (RF-07). Read-only for the user. */
  readonly expirationPreview: string | null;
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
    const type = findMembershipType(values.membershipTypeId);
    if (!type || !isIsoDate(values.startDate)) return null;
    return calculateExpirationDate(values.startDate, type.term);
  }, [values.membershipTypeId, values.startDate]);

  const submit = useCallback((): ClientDraft | null => {
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return null;

    // Safe: validate() rejected anything that is not an IsoDate.
    const startDate = values.startDate;
    if (!isIsoDate(startDate)) return null;

    return {
      fullName: values.fullName.trim(),
      idNumber: values.idNumber.trim(),
      phone: values.phone.trim(),
      email: values.email.trim(),
      membershipTypeId: values.membershipTypeId,
      status: values.status,
      startDate,
    };
  }, [values]);

  return { values, errors, expirationPreview, setValue, submit };
}
