import type { NombreIcono } from "./modulos";
import type { FormaPago } from "./clientes";
import { formasPago } from "./clientes";
import { planesMembresiaIniciales, type PlanMembresia } from "./membresias";

/*
  =====================================================
  PAGOS Y ABONOS (RF-17 a RF-21, RN 4.3)
  =====================================================
*/

export type MetodoPago = FormaPago;
export const metodosPago = formasPago;

export type TipoAbono = "completo" | "1er abono" | "2do abono" | "abono final";

export interface Pago {
  id: string;

  clienteId: number;
  clienteNombre: string;

  membresiaId: string;
  membresiaNombre: string;

  // Identifica el ciclo de membresía al que pertenece este abono
  // (permite acumular varios abonos hasta completar el valor total).
  cicloId: string;

  valorMembresia: number;
  valorPagado: number;
  saldoPendiente: number; // saldo restante DESPUES de este pago

  tipoAbono: TipoAbono;

  fecha: string; // YYYY-MM-DD
  metodo: MetodoPago;
  referencia: string;
  usuarioRegistro: string;
  observaciones: string;
}

export function generarCicloId(clienteId: number, fechaIngreso: string): string {
  return `${clienteId}-${fechaIngreso}`;
}

/*
  -----------------------------------------------------
  SALDO PENDIENTE (RF-18)
  -----------------------------------------------------
*/

export function calcularTotalPagado(pagos: Pago[], cicloId: string): number {
  return pagos
    .filter((pago) => pago.cicloId === cicloId)
    .reduce((acumulado, pago) => acumulado + pago.valorPagado, 0);
}

export function calcularSaldoPendiente(
  pagos: Pago[],
  cicloId: string,
  valorMembresia: number
): number {
  return Math.max(valorMembresia - calcularTotalPagado(pagos, cicloId), 0);
}

/*
  -----------------------------------------------------
  ETIQUETA DEL ABONO (RF-20)
  -----------------------------------------------------
*/

export function determinarTipoAbono(
  cantidadAbonosPrevios: number,
  saldoPendienteDespues: number
): TipoAbono {
  if (saldoPendienteDespues <= 0) {
    return cantidadAbonosPrevios === 0 ? "completo" : "abono final";
  }

  return cantidadAbonosPrevios === 0 ? "1er abono" : "2do abono";
}

/*
  -----------------------------------------------------
  VALIDACION DEL ABONO MINIMO (RF-19, RN 4.3)
  -----------------------------------------------------
*/

export function validarAbono(
  monto: number,
  plan: PlanMembresia,
  saldoPendienteAntes: number
): string[] {
  const errores: string[] = [];

  if (monto <= 0) {
    errores.push("El monto debe ser mayor que cero.");
  }

  if (monto > saldoPendienteAntes) {
    errores.push("El monto no puede superar el saldo pendiente.");
  }

  // Las membresías sin abono mínimo definido no admiten pago parcial (RN 4.3).
  if (plan.abonoMinimo === null && monto < saldoPendienteAntes) {
    errores.push(
      `${plan.nombre} no admite abonos: debe pagarse de forma completa.`
    );
  }

  // El abono no puede ser menor al mínimo, salvo que sea el abono
  // que cierra el saldo pendiente (abono final).
  if (
    plan.abonoMinimo !== null &&
    monto < plan.abonoMinimo &&
    monto < saldoPendienteAntes
  ) {
    errores.push(
      `El abono mínimo para ${plan.nombre} es ${plan.abonoMinimo.toLocaleString("es-CO")}.`
    );
  }

  return errores;
}

export function validarPago(pago: Pago): string[] {
  const errores: string[] = [];

  if (!pago.clienteNombre.trim()) {
    errores.push("El nombre del cliente es obligatorio.");
  }

  if (!pago.membresiaId) {
    errores.push("Debe seleccionar el tipo de membresía.");
  }

  if (pago.valorPagado <= 0) {
    errores.push("El monto debe ser mayor que cero.");
  }

  if (!pago.fecha) {
    errores.push("La fecha del pago es obligatoria.");
  }

  if (!pago.referencia.trim()) {
    errores.push("La referencia del pago es obligatoria.");
  }

  if (!pago.metodo) {
    errores.push("Debe indicar el método de pago.");
  }

  return errores;
}

/*
  -----------------------------------------------------
  DATOS DE PRUEBA
  -----------------------------------------------------
*/

function plan(id: string): PlanMembresia {
  return planesMembresiaIniciales.find((item) => item.id === id)!;
}

export const pagosIniciales: Pago[] = [
  {
    id: "pago-1",
    clienteId: 1,
    clienteNombre: "Juan Pérez",
    membresiaId: "mensualidad",
    membresiaNombre: plan("mensualidad").nombre,
    cicloId: generarCicloId(1, "2026-08-15"),
    valorMembresia: plan("mensualidad").valor,
    valorPagado: plan("mensualidad").valor,
    saldoPendiente: 0,
    tipoAbono: "completo",
    fecha: "2026-08-15",
    metodo: "transferencia",
    referencia: "TRX-20260815-001",
    usuarioRegistro: "apexg",
    observaciones: "Pago confirmado por transferencia bancaria.",
  },
  {
    id: "pago-2",
    clienteId: 2,
    clienteNombre: "Laura Gómez",
    membresiaId: "personalizado",
    membresiaNombre: plan("personalizado").nombre,
    cicloId: generarCicloId(2, "2026-08-20"),
    valorMembresia: plan("personalizado").valor,
    valorPagado: 100000,
    saldoPendiente: 100000,
    tipoAbono: "1er abono",
    fecha: "2026-08-20",
    metodo: "tarjeta",
    referencia: "TAR-20260820-220",
    usuarioRegistro: "apexg",
    observaciones: "Primer abono del plan personalizado.",
  },
  {
    id: "pago-3",
    clienteId: 3,
    clienteNombre: "Carlos Rodríguez",
    membresiaId: "mensualidad",
    membresiaNombre: plan("mensualidad").nombre,
    cicloId: generarCicloId(3, "2026-07-25"),
    valorMembresia: plan("mensualidad").valor,
    valorPagado: 30000,
    saldoPendiente: 35000,
    tipoAbono: "1er abono",
    fecha: "2026-07-25",
    metodo: "efectivo",
    referencia: "EFE-20260725-007",
    usuarioRegistro: "apexg",
    observaciones: "Quedó saldo pendiente; el cliente pasó a mora.",
  },
];

/*
  -----------------------------------------------------
  SECCIONES DEL MODULO PAGOS
  -----------------------------------------------------
*/

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
    id: "registrar",
    nombre: "Registrar pago",
    titulo: "Registrar pago o abono",
    icono: "usuario-mas",
  },
  {
    id: "con-saldo",
    nombre: "Con saldo pendiente",
    titulo: "Pagos con saldo pendiente",
    icono: "reloj",
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
