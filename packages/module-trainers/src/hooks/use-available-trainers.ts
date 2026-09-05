"use client";

import { useMemo } from "react";
import type { Client, IsoDate, Trainer, TrainerId } from "@apexg/core";
import { assignedClientCount, hasCapacity } from "@apexg/core";
import type { TrainerModuleSection } from "./section-types";

/**
 * The trainers a list section should show.
 *
 * Availability depends on the client list (RF-25), which a per-item predicate
 * in the catalogue cannot see — so the capacity filter lives here rather than
 * in the section.
 */
export function useVisibleTrainers(
  trainers: readonly Trainer[],
  clients: readonly Client[],
  section: TrainerModuleSection,
  referenceDate: IsoDate,
): readonly Trainer[] {
  return useMemo(() => {
    if (section.view.kind !== "list") return [];
    const { includes } = section.view;

    const matching = trainers.filter((trainer) =>
      includes(trainer, referenceDate),
    );

    if (section.id !== "available") return matching;

    return matching.filter((trainer) =>
      hasCapacity(
        trainer,
        assignedClientCount(clients, trainer.id as TrainerId),
      ),
    );
  }, [trainers, clients, section, referenceDate]);
}
