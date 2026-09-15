/**
 * Tipos del módulo Finanzas (RF-31 a RF-33, RF-35). Módulo de solo
 * lectura salvo el cierre mensual (RF-32): agrega sobre `payments`,
 * `expenses` y `clients`, ya construidos por sus propios módulos.
 */

export interface BalanceSummary {
  from: string;
  to: string;
  income: string;
  expenses: string;
  net: string;
}

export interface MonthlySummary {
  year: number;
  month: number;
  income: string;
  expenses: string;
  profit: string;
  previousMonth: {
    year: number;
    month: number;
    profit: string;
  };
  /** null cuando el mes anterior tuvo utilidad 0 (no hay base para un %). */
  profitChangePercent: number | null;
}

/** RF-33, RF-35 [PROPUESTA]. */
export interface FinanceDashboard {
  monthIncome: string;
  activeClients: number;
  overdueClients: number;
  previousMonthIncome: string;
  incomeChangePercent: number | null;
}

export interface MonthlyClosureResult {
  id: string;
  year: number;
  month: number;
  observations: string | null;
  closedBy: string | null;
  closedAt: string | null;
}
