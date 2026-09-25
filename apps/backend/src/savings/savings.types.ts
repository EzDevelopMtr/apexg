/** Tipos del módulo Bolsillos de ahorro. Montos como string — NUMERIC. */

export interface SavingsPocketResult {
  id: string;
  name: string;
  goalAmount: string;
  closed: boolean;
  /** Suma de sus aportes, calculada por la base — no la reconstruye el cliente. */
  savedAmount: string;
  createdAt: string | null;
}

export interface SavingsContributionResult {
  id: string;
  pocketId: string;
  amount: string;
  savedOn: string;
  notes: string | null;
  /** Quién lo registró, para el rastro de RNF-07. */
  recordedBy: string;
}

export interface ListContributionsFilter {
  pocketId?: string;
  from?: string;
  to?: string;
}
