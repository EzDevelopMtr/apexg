"use client";

import { useCallback } from "react";
import { useParams } from "next/navigation";

/** The gym this page belongs to: the first segment of its address. */
export function useGym(): string {
  const { gym } = useParams<{ gym: string }>();
  return gym;
}

/**
 * Turns a path inside a gym ("/modules/clients") into this gym's address
 * ("/smartfit/modules/clients"). Every link and redirect inside the app goes
 * through it, so a page can only ever send people on within its own gym.
 */
export function useGymPath(): (path: string) => string {
  const gym = useGym();
  return useCallback((path: string) => `/${gym}${path}`, [gym]);
}
