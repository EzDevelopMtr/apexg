"use client";

import { useCallback } from "react";
import type { MembershipType } from "@apexg/core";
import { useCollection } from "./use-collection";
import type { Collection } from "./use-collection";
import { useRepositories } from "./use-repositories";

/**
 * Read-only view of the membership type catalogue (RF-13).
 *
 * Clients, Payments and the daily log all need to resolve a client's plan
 * (name, price, trainer split) but none of them manage the catalogue —
 * that is `@apexg/module-memberships`'s own `useMembershipTypes`, which adds
 * `save`/`remove` (RF-12, admin only) on top of this same read.
 */
export function useMembershipTypeCatalog(): Collection<MembershipType> {
  const { membershipTypes } = useRepositories();
  const load = useCallback(() => membershipTypes.list(), [membershipTypes]);
  return useCollection<MembershipType>(load);
}
