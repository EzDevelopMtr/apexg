import { calcularFechaVencimiento, planesMembresiaIniciales } from "./membresias";

/*
  =====================================================
  CLIENTES (RF-04 a RF-09, RN 4.2)
  =====================================================
*/

export type EstadoCliente = "Activo" | "Inactivo" | "En mora";

export type FormaPago = "efectivo" | "transferencia" | "tarjeta" | "nequi";

export const formasPago: Array<{ value: FormaPago; label: string }> = [
  { value: "efectivo", label: "Efectivo" },
  { value: "transferencia", label: "Transferencia" },
  { value: "tarjeta", label: "Tarjeta" },
  { value: "nequi", label: "Nequi" },
];

export const tiposSangre = [
  "O+",
  "O-",
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
] as const;

export type TipoSangre = (typeof tiposSangre)[number];

export interface Cliente {
  id: number;

  nombre: string;
  documento: string;
  telefono: string;
  correo: string;

  // RF-04: datos adicionales requeridos por el ERS.
  contactoEmergencia: string;
  formaPago: FormaPago;
  tipoSangre: TipoSangre | "";
  fechaCumpleanos: string; // YYYY-MM-DD
  condicionMedica: string; // "N/A" si no aplica
  comentarios: string; // novedades/observaciones

  // Referencia al catalogo de @apexg/core → membresias.ts
  membresiaId: string;

  // RF-06: se asigna automaticamente pero es editable.
  fechaIngreso: string; // YYYY-MM-DD

  // RF-07: calculada a partir de fechaIngreso + membresiaId.
  fechaVencimiento: string; // YYYY-MM-DD

  // RF-08 / RN 4.2: Activo, Inactivo o En mora. No existe "congelado".
  estado: EstadoCliente;

  // Solo aplica a planes Personalizado / Semipersonalizado (RF-24).
  entrenadorId?: string;
}

/*
  -----------------------------------------------------
  CALCULO DE FECHA DE VENCIMIENTO (RF-07)
  -----------------------------------------------------
*/

export function calcularVencimientoCliente(
  fechaIngreso: string,
  membresiaId: string
): string {
  const plan = planesMembresiaIniciales.find((item) => item.id === membresiaId);

  if (!plan) {
    return fechaIngreso;
  }

  return calcularFechaVencimiento(fechaIngreso, plan.vigencia);
}

/*
  -----------------------------------------------------
  TRANSICION AUTOMATICA A "EN MORA" (RF-21)
  -----------------------------------------------------

  Se activa automaticamente al cumplirse la fecha de
  vencimiento sin un pago que renueve la membresia.

  No se reclasifica a un cliente que el usuario marco
  manualmente como "Inactivo" (retiro, numeral 4.5).
*/

export function calcularEstadoCliente(
  cliente: Cliente,
  fechaHoy: string = new Date().toISOString().slice(0, 10)
): EstadoCliente {
  if (cliente.estado === "Inactivo") {
    return "Inactivo";
  }

  return cliente.fechaVencimiento < fechaHoy ? "En mora" : "Activo";
}

export function diasParaVencer(
  fechaVencimiento: string,
  fechaHoy: string = new Date().toISOString().slice(0, 10)
): number {
  const unDiaMs = 1000 * 60 * 60 * 24;
  const vencimiento = new Date(`${fechaVencimiento}T00:00:00.000Z`).getTime();
  const hoy = new Date(`${fechaHoy}T00:00:00.000Z`).getTime();

  return Math.round((vencimiento - hoy) / unDiaMs);
}

/*
  -----------------------------------------------------
  VALIDACION
  -----------------------------------------------------
*/

export function validarCliente(cliente: Cliente): string[] {
  const errores: string[] = [];

  if (!cliente.nombre.trim()) {
    errores.push("El nombre del cliente es obligatorio.");
  }

  if (!cliente.documento.trim()) {
    errores.push("El documento del cliente es obligatorio.");
  }

  if (!cliente.telefono.trim()) {
    errores.push("El teléfono del cliente es obligatorio.");
  }

  if (!cliente.contactoEmergencia.trim()) {
    errores.push("El contacto de emergencia es obligatorio.");
  }

  if (!cliente.membresiaId) {
    errores.push("Debe seleccionar un tipo de membresía.");
  }

  if (!cliente.fechaIngreso) {
    errores.push("La fecha de ingreso es obligatoria.");
  }

  const plan = planesMembresiaIniciales.find((item) => item.id === cliente.membresiaId);

  if (plan?.requiereEntrenador && !cliente.entrenadorId) {
    errores.push("Este plan requiere seleccionar un entrenador.");
  }

  return errores;
}

/*
  -----------------------------------------------------
  DATOS DE PRUEBA
  -----------------------------------------------------
*/

export const clientesIniciales: Cliente[] = [
  {
    id: 1,
    nombre: "Juan Pérez",
    documento: "1001234567",
    telefono: "3001234567",
    correo: "juan@email.com",
    contactoEmergencia: "María Pérez - 3009876543",
    formaPago: "transferencia",
    tipoSangre: "O+",
    fechaCumpleanos: "1994-03-12",
    condicionMedica: "N/A",
    comentarios: "",
    membresiaId: "mensualidad",
    fechaIngreso: "2026-08-15",
    fechaVencimiento: "2026-09-15",
    estado: "Activo",
  },
  {
    id: 2,
    nombre: "Laura Gómez",
    documento: "1007654321",
    telefono: "3017654321",
    correo: "laura@email.com",
    contactoEmergencia: "Pedro Gómez - 3011122334",
    formaPago: "tarjeta",
    tipoSangre: "A+",
    fechaCumpleanos: "1990-11-02",
    condicionMedica: "Asma leve",
    comentarios: "Prefiere entrenar en las mañanas.",
    membresiaId: "personalizado",
    fechaIngreso: "2026-08-20",
    fechaVencimiento: "2026-09-20",
    estado: "Activo",
    entrenadorId: "ent-001",
  },
  {
    id: 3,
    nombre: "Carlos Rodríguez",
    documento: "1012345678",
    telefono: "3102345678",
    correo: "carlos@email.com",
    contactoEmergencia: "Ana Rodríguez - 3157654321",
    formaPago: "efectivo",
    tipoSangre: "B+",
    fechaCumpleanos: "1988-06-25",
    condicionMedica: "N/A",
    comentarios: "",
    membresiaId: "mensualidad",
    fechaIngreso: "2026-07-25",
    fechaVencimiento: "2026-08-25",
    estado: "En mora",
  },
  {
    id: 4,
    nombre: "Ana Martínez",
    documento: "1018765432",
    telefono: "3158765432",
    correo: "ana@email.com",
    contactoEmergencia: "Luis Martínez - 3201234567",
    formaPago: "efectivo",
    tipoSangre: "AB-",
    fechaCumpleanos: "1996-01-30",
    condicionMedica: "N/A",
    comentarios: "Se retiró temporalmente.",
    membresiaId: "quincena",
    fechaIngreso: "2026-07-05",
    fechaVencimiento: "2026-07-20",
    estado: "Inactivo",
  },
  {
    id: 5,
    nombre: "Pedro Sánchez",
    documento: "1023456789",
    telefono: "3203456789",
    correo: "pedro@email.com",
    contactoEmergencia: "Sofía Sánchez - 3159876543",
    formaPago: "nequi",
    tipoSangre: "O-",
    fechaCumpleanos: "1985-09-18",
    condicionMedica: "N/A",
    comentarios: "",
    membresiaId: "semipersonalizado",
    fechaIngreso: "2026-08-11",
    fechaVencimiento: "2026-09-11",
    estado: "Activo",
    entrenadorId: "ent-002",
  },
];
