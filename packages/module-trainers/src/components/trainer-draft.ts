import type { Trainer } from "@apexg/core";
import { fromPesos, isIsoDate, today } from "@apexg/core";

export type TrainerDraft = Omit<Trainer, "id">;

export function initialDraft(trainer?: Trainer): TrainerDraft {
  return {
    fullName: trainer?.fullName ?? "",
    idNumber: trainer?.idNumber ?? "",
    phone: trainer?.phone ?? "",
    certifications: trainer?.certifications ?? "N/A",
    hiredOn: trainer?.hiredOn ?? today(),
    salary: trainer?.salary ?? fromPesos(0),
    maxClients: trainer?.maxClients ?? 10,
    active: trainer?.active ?? true,
  };
}

/** Mirrors what the API must also enforce (RNF-07). */
export function validateDraft(draft: TrainerDraft): string | null {
  if (!draft.fullName.trim()) return "El nombre es obligatorio.";
  if (!draft.idNumber.trim()) return "El documento es obligatorio.";
  if (!draft.phone.trim()) return "El teléfono es obligatorio.";
  if (!isIsoDate(draft.hiredOn))
    return "La fecha de contratación no es válida.";
  if (draft.salary <= 0) return "El sueldo debe ser mayor que cero.";
  if (draft.maxClients <= 0) return "El cupo máximo debe ser mayor que cero.";
  return null;
}
