/**
 * Tipos del módulo Apartado diario (RF-34): una fila por día
 * (`daily_logs`, única por `company_id` + `log_date`) con observaciones
 * libres, más datos derivados de otros módulos — no almacenados aquí.
 */

export interface NewClientSummary {
  clientId: string;
  fullName: string;
  phone: string | null;
  /** null si aún no se le registró un pago (posible el mismo día). */
  paymentMethod: string | null;
  membershipType: string | null;
}

export interface DailyLogSummary {
  date: string;
  observations: string | null;
  updatedAt: string | null;
  /** RF-34: ingresos del día (suma de `payments` de esa fecha, día local). */
  todayIncome: string;
  /** RF-34: clientes nuevos registrados ese día. */
  newClients: NewClientSummary[];
}
