"use client";

import { useState } from "react";

/** The inline "add an exception" row: which gym, with what value, before it is saved. */
export function useExceptionAdder(initialValue: () => unknown) {
  const [open, setOpen] = useState(false);
  const [companyId, setCompanyId] = useState("");
  const [value, setValue] = useState<unknown>(undefined);
  const [editing, setEditing] = useState<string | null>(null);

  const start = (firstCompanyId: string) => {
    setCompanyId(firstCompanyId);
    setValue(initialValue());
    setOpen(true);
  };

  return {
    open,
    companyId,
    setCompanyId,
    value,
    setValue,
    start,
    stop: () => setOpen(false),
    /** For module lists: which exception row has its switches out. */
    editing,
    toggleEditing: (id: string) => setEditing((current) => (current === id ? null : id)),
  };
}
