"use client";

import { useMemo, useState } from "react";
import type { CompanyStatus, PlatformCompany } from "@apexg/core";

export type StatusFilter = "all" | CompanyStatus;

/** Search by name or address, and narrow by status. */
export function useGymFilter(companies: readonly PlatformCompany[]) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return companies.filter(
      (company) =>
        (status === "all" || company.status === status) &&
        (company.name.toLowerCase().includes(needle) || company.slug.includes(needle)),
    );
  }, [companies, query, status]);

  return { query, setQuery, status, setStatus, visible };
}
