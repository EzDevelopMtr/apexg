export type EstadoPago = "pendiente" | "pagado" | "vencido";

export type MetodoPago =
  | "efectivo"
  | "transferencia"
  | "tarjeta"
  | "nequi";

export const conceptosPago = [
  "Membresía mensual",
  "Membresía trimestral",
  "Membresía anual",
  "Entrenamiento personal",
  "Clases grupales",
  "Pago a entrenador",
  "Otro",
] as const;

export type ConceptoPago = (typeof conceptosPago)[number];
export type TipoDestinoPago = "cliente" | "entrenador";

export interface Pago {
  id: string;
  tipo: TipoDestinoPago;
  clienteId: string;
  clienteNombre: string;
  entrenadorId?: string;
  entrenadorNombre?: string;
  concepto: ConceptoPago;
  monto: number;
  fecha: string;
  vencimiento: string;
  metodo: MetodoPago;
  referencia: string;
  estado: EstadoPago;
  observaciones: string;
}

export const pagosIniciales: Pago[] = [
  {
    id: "pago-1",
    tipo: "cliente",
    clienteId: "cli-001",
    clienteNombre: "Juan Pérez",
    concepto: "Membresía mensual",
    monto: 65000,
    fecha: "2026-08-01",
    vencimiento: "2026-08-31",
    metodo: "transferencia",
    referencia: "TRX-20260801-001",
    estado: "pagado",
    observaciones: "Pago confirmado por transferencia bancaria.",
  },
  {
    id: "pago-2",
    tipo: "cliente",
    clienteId: "cli-002",
    clienteNombre: "Laura Gómez",
    concepto: "Membresía trimestral",
    monto: 180000,
    fecha: "2026-08-05",
    vencimiento: "2026-10-31",
    metodo: "tarjeta",
    referencia: "TAR-20260805-220",
    estado: "pendiente",
    observaciones: "Cobro programado para la fecha de vencimiento.",
  },
  {
    id: "pago-3",
    tipo: "cliente",
    clienteId: "cli-003",
    clienteNombre: "Carlos Rodríguez",
    concepto: "Membresía mensual",
    monto: 65000,
    fecha: "2026-07-25",
    vencimiento: "2026-08-25",
    metodo: "efectivo",
    referencia: "EFE-20260725-007",
    estado: "vencido",
    observaciones: "Pago aún pendiente fuera de la fecha límite.",
  },
  {
    id: "pago-4",
    tipo: "cliente",
    clienteId: "cli-005",
    clienteNombre: "Pedro Sánchez",
    concepto: "Membresía anual",
    monto: 600000,
    fecha: "2026-08-11",
    vencimiento: "2027-01-10",
    metodo: "nequi",
    referencia: "NEQ-20260811-450",
    estado: "pagado",
    observaciones: "Pago realizado a través de Nequi.",
  },
];

export function validarPago(pago: Pago): string[] {
  const errores: string[] = [];

  if (pago.tipo === "cliente" && !pago.clienteNombre.trim()) {
    errores.push("El nombre del cliente es obligatorio.");
  }

  if (pago.tipo === "entrenador" && !pago.entrenadorNombre?.trim()) {
    errores.push("El nombre del entrenador es obligatorio.");
  }

  if (!pago.concepto.trim()) {
    errores.push("El concepto del pago es obligatorio.");
  }

  if (pago.monto <= 0) {
    errores.push("El monto debe ser mayor que cero.");
  }

  if (!pago.fecha) {
    errores.push("La fecha del pago es obligatoria.");
  }

  if (!pago.vencimiento) {
    errores.push("La fecha de vencimiento es obligatoria.");
  }

  if (!pago.referencia.trim()) {
    errores.push("La referencia del pago es obligatoria.");
  }

  if (!pago.metodo) {
    errores.push("Debe indicar el método de pago.");
  }

  return errores;
}

import type { NombreIcono } from "./modulos";

export interface SeccionPagos {
  id: string;
  nombre: string;
  titulo: string;
  icono: NombreIcono;
}

export const seccionesPagos: SeccionPagos[] = [
  {
    id: "todos",
    nombre: "Todos los pagos",
    titulo: "Todos los pagos",
    icono: "lista",
  },
  {
    id: "pendientes",
    nombre: "Pendientes",
    titulo: "Pagos pendientes",
    icono: "reloj",
  },
  {
    id: "pagados",
    nombre: "Pagados",
    titulo: "Pagos realizados",
    icono: "usuario-ok",
  },
  {
    id: "vencidos",
    nombre: "Vencidos",
    titulo: "Pagos vencidos",
    icono: "usuario-x",
  },
];

export const seccionPagosPorDefecto = "todos";

export function esSeccionPagos(valor: string): boolean {
  return seccionesPagos.some((seccion) => seccion.id === valor);
}

export function tituloSeccionPagos(id: string): string {
  const seccion = seccionesPagos.find((item) => item.id === id);
  return seccion?.titulo ?? "Pagos";
}
