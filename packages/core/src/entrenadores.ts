import type { NombreIcono } from "./modulos";

/*
  =====================================================
  ENTRENADORES (RF-22 a RF-25)
  =====================================================
*/

export interface Entrenador {
  id: string;
  nombre: string;
  documento: string;
  telefono: string;
  certificados: string; // "N/A" si no aplica
  fechaContratacion: string; // YYYY-MM-DD
  sueldo: number;

  /*
    Disponibilidad para recibir clientes nuevos
    (Personalizado / Semipersonalizado).

    El criterio exacto (cupo por franja horaria, etc.)
    quedo pendiente de definir con el cliente
    (numeral 8 del ERS). Por ahora se modela como un
    cupo maximo simple de clientes asignados.
  */
  cupoMaximo: number;
  activo: boolean;
}

export const entrenadoresIniciales: Entrenador[] = [
  {
    id: "ent-001",
    nombre: "Andrés Villalba",
    documento: "1015678234",
    telefono: "3116549872",
    certificados: "Certificación en entrenamiento funcional",
    fechaContratacion: "2025-02-01",
    sueldo: 1800000,
    cupoMaximo: 15,
    activo: true,
  },
  {
    id: "ent-002",
    nombre: "Camila Ruiz",
    documento: "1022345987",
    telefono: "3204558712",
    certificados: "N/A",
    fechaContratacion: "2025-06-15",
    sueldo: 1600000,
    cupoMaximo: 10,
    activo: true,
  },
];

export function validarEntrenador(entrenador: Entrenador): string[] {
  const errores: string[] = [];

  if (!entrenador.nombre.trim()) {
    errores.push("El nombre del entrenador es obligatorio.");
  }

  if (!entrenador.documento.trim()) {
    errores.push("El documento del entrenador es obligatorio.");
  }

  if (!entrenador.telefono.trim()) {
    errores.push("El teléfono del entrenador es obligatorio.");
  }

  if (!entrenador.fechaContratacion) {
    errores.push("La fecha de contratación es obligatoria.");
  }

  if (entrenador.sueldo <= 0) {
    errores.push("El sueldo debe ser mayor que cero.");
  }

  if (entrenador.cupoMaximo <= 0) {
    errores.push("El cupo máximo debe ser mayor que cero.");
  }

  return errores;
}

/*
  -----------------------------------------------------
  DISPONIBILIDAD (RF-25)
  -----------------------------------------------------
*/

export function clientesAsignados(
  entrenadorId: string,
  asignaciones: Array<{ entrenadorId?: string }>
): number {
  return asignaciones.filter((item) => item.entrenadorId === entrenadorId).length;
}

export function estaDisponible(
  entrenador: Entrenador,
  cantidadAsignada: number
): boolean {
  return entrenador.activo && cantidadAsignada < entrenador.cupoMaximo;
}

/*
  -----------------------------------------------------
  COMISIONES (RF-23, RF-16, RN 4.4)
  -----------------------------------------------------

  Se genera una comision cuando un pago completa el
  valor de un plan Personalizado o Semipersonalizado.
*/

export interface ComisionEntrenador {
  id: string;
  entrenadorId: string;
  entrenadorNombre: string;
  clienteId: number;
  clienteNombre: string;
  planId: string;
  planNombre: string;
  valorEntrenador: number;
  valorNegocio: number;
  fecha: string; // YYYY-MM-DD
  pagoId: string;
}

/*
  -----------------------------------------------------
  SECCIONES DEL MODULO ENTRENADORES
  -----------------------------------------------------
*/

export interface SeccionEntrenadores {
  id: string;
  nombre: string;
  titulo: string;
  icono: NombreIcono;
}

export const seccionesEntrenadores: SeccionEntrenadores[] = [
  {
    id: "todos",
    nombre: "Todos los entrenadores",
    titulo: "Todos los entrenadores",
    icono: "lista",
  },
  {
    id: "disponibles",
    nombre: "Disponibles",
    titulo: "Entrenadores disponibles",
    icono: "usuario-ok",
  },
  {
    id: "comisiones",
    nombre: "Comisiones",
    titulo: "Comisiones por entrenador",
    icono: "billetera",
  },
];

export const seccionEntrenadoresPorDefecto = "todos";

export function esSeccionEntrenadores(valor: string): boolean {
  return seccionesEntrenadores.some((seccion) => seccion.id === valor);
}

export function tituloSeccionEntrenadores(id: string): string {
  const seccion = seccionesEntrenadores.find((item) => item.id === id);
  return seccion?.titulo ?? "Entrenadores";
}
