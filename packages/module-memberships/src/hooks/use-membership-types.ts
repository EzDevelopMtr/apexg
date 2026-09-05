"use client";

import { useCallback } from "react";
import type { MembershipType } from "@apexg/core";
import { useCollection, upsertById, useRepositories } from "@apexg/module-kit";
import type { Collection } from "@apexg/module-kit";

export interface UseMembershipTypesResult extends Collection<MembershipType> {
  /** Creates or updates a plan (RF-12). Admin only — the route guards it. */
  readonly save: (type: MembershipType) => Promise<void>;
  readonly remove: (type: MembershipType) => Promise<void>;
}

export function useMembershipTypes(): UseMembershipTypesResult {
  const { membershipTypes } = useRepositories();

  const load = useCallback(() => membershipTypes.list(), [membershipTypes]);
  const collection = useCollection<MembershipType>(load);
  const { apply } = collection;

  const save = useCallback(
    async (type: MembershipType) => {
      const saved = await membershipTypes.save(type);
      apply((current) => upsertById(current, saved));
    },
    [membershipTypes, apply],
  );

  const remove = useCallback(
    async (type: MembershipType) => {
      await membershipTypes.remove(type.id);
      apply((current) => current.filter((item) => item.id !== type.id));
    },
    [membershipTypes, apply],
  );

  return { ...collection, save, remove };
}
