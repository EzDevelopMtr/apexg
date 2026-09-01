export type TipoVigencia = "dias" | "meses";

export type TipoPromocion = "amigos-familiar" | "folleto-fisico";

export type TipoPlanMembresia =
  | "regular"
  | "promocional"
  | "personalizado"
  | "semipersonalizado";

export interface VigenciaMembresia {
  tipo: TipoVigencia;
  cantidad: number;
}

export interface DistribucionMembresia {
  entrenador: number;
  negocio: number;
}

export interface PlanMembresia {
  id: string;
  nombre: string;
  tipo: TipoPlanMembresia;
  valor: number;
  condiciones: string;
  vigencia: VigenciaMembresia;
  abonoMinimo: number | null;
  promocion: TipoPromocion | null;
  requiereEntrenador: boolean;
  distribucion: DistribucionMembresia | null;
  activo: boolean;
}

export const planesMembresiaIniciales: PlanMembresia[] = [
  {
    id: "mensualidad",
    nombre: "Mensualidad (lunes a sábado)",
    tipo: "regular",
    valor: 65000,
    condiciones: "Acceso de lunes a sábado.",
    vigencia: { tipo: "meses", cantidad: 1 },
    abonoMinimo: 30000,
    promocion: null,
    requiereEntrenador: false,
    distribucion: null,
    activo: true,
  },
  {
    id: "mes-tres-veces",
    nombre: "Mes 3 veces por semana",
    tipo: "regular",
    valor: 50000,
    condiciones: "Tres días por semana, organizables durante un mes.",
    vigencia: { tipo: "meses", cantidad: 1 },
    abonoMinimo: 30000,
    promocion: null,
    requiereEntrenador: false,
    distribucion: null,
    activo: true,
  },
  {
    id: "quincena",
    nombre: "Quincena",
    tipo: "regular",
    valor: 45000,
    condiciones: "Vigencia de 15 días calendario desde la fecha de inicio.",
    vigencia: { tipo: "dias", cantidad: 15 },
    abonoMinimo: null,
    promocion: null,
    requiereEntrenador: false,
    distribucion: null,
    activo: true,
  },
  {
    id: "semana",
    nombre: "Semana",
    tipo: "regular",
    valor: 25000,
    condiciones: "Vigencia de 7 días calendario.",
    vigencia: { tipo: "dias", cantidad: 7 },
    abonoMinimo: null,
    promocion: null,
    requiereEntrenador: false,
    distribucion: null,
    activo: true,
  },
  {
    id: "dia",
    nombre: "Día",
    tipo: "regular",
    valor: 6000,
    condiciones: "Vigencia de 1 día calendario.",
    vigencia: { tipo: "dias", cantidad: 1 },
    abonoMinimo: null,
    promocion: null,
    requiereEntrenador: false,
    distribucion: null,
    activo: true,
  },
  {
    id: "promo-amigos-familiar",
    nombre: "Promo amigos/familiar",
    tipo: "promocional",
    valor: 60000,
    condiciones: "Aplica a grupos de 3 o más clientes que pagan juntos.",
    vigencia: { tipo: "meses", cantidad: 1 },
    abonoMinimo: null,
    promocion: "amigos-familiar",
    requiereEntrenador: false,
    distribucion: null,
    activo: true,
  },
  {
    id: "promo-folleto-fisico",
    nombre: "Promo folleto físico",
    tipo: "promocional",
    valor: 55000,
    condiciones: "Solo para clientes nuevos al momento de inscribirse.",
    vigencia: { tipo: "meses", cantidad: 1 },
    abonoMinimo: null,
    promocion: "folleto-fisico",
    requiereEntrenador: false,
    distribucion: null,
    activo: true,
  },
  {
    id: "personalizado",
    nombre: "Personalizado",
    tipo: "personalizado",
    valor: 200000,
    condiciones: "Entrenamiento personalizado 1 a 1.",
    vigencia: { tipo: "meses", cantidad: 1 },
    abonoMinimo: 100000,
    promocion: null,
    requiereEntrenador: true,
    distribucion: { entrenador: 100000, negocio: 100000 },
    activo: true,
  },
  {
    id: "semipersonalizado",
    nombre: "Semipersonalizado",
    tipo: "semipersonalizado",
    valor: 150000,
    condiciones: "Entrenamiento semipersonalizado.",
    vigencia: { tipo: "meses", cantidad: 1 },
    abonoMinimo: 75000,
    promocion: null,
    requiereEntrenador: true,
    distribucion: { entrenador: 75000, negocio: 75000 },
    activo: true,
  },
];

function crearFechaUTC(fechaISO: string): Date {
  const fecha = new Date(`${fechaISO}T00:00:00.000Z`);

  if (Number.isNaN(fecha.getTime())) {
    throw new Error("La fecha debe tener formato YYYY-MM-DD.");
  }

  return fecha;
}

function formatearFechaISO(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}

export function calcularFechaVencimiento(
  fechaInicio: string,
  vigencia: VigenciaMembresia
): string {
  const fecha = crearFechaUTC(fechaInicio);

  if (vigencia.tipo === "dias") {
    fecha.setUTCDate(fecha.getUTCDate() + vigencia.cantidad);
  } else {
    fecha.setUTCMonth(fecha.getUTCMonth() + vigencia.cantidad);
  }

  return formatearFechaISO(fecha);
}

export function validarPlanMembresia(
  plan: PlanMembresia
): string[] {
  const errores: string[] = [];

  if (!plan.nombre.trim()) {
    errores.push("El nombre del plan es obligatorio.");
  }

  if (plan.valor <= 0) {
    errores.push("El valor del plan debe ser mayor que cero.");
  }

  if (plan.vigencia.cantidad <= 0) {
    errores.push("La vigencia debe ser mayor que cero.");
  }

  if (plan.abonoMinimo !== null) {
    if (plan.abonoMinimo <= 0) {
      errores.push("El abono mínimo debe ser mayor que cero.");
    }

    if (plan.abonoMinimo > plan.valor) {
      errores.push("El abono mínimo no puede superar el valor del plan.");
    }
  }

  if (plan.promocion !== null && plan.abonoMinimo !== null) {
    errores.push("Las promociones deben pagarse de forma completa.");
  }

  if (plan.requiereEntrenador && plan.distribucion === null) {
    errores.push("Los planes con entrenador requieren una distribución.");
  }

  if (!plan.requiereEntrenador && plan.distribucion !== null) {
    errores.push("Solo los planes con entrenador pueden tener distribución.");
  }

  if (plan.distribucion !== null) {
    const total = plan.distribucion.entrenador + plan.distribucion.negocio;

    if (total !== plan.valor) {
      errores.push("La distribución debe coincidir con el valor del plan.");
    }
  }

  return errores;
}
