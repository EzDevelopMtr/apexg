import type { NombreIcono } from "./modulos";
import type { Cliente } from "./clientes";
import type { Pago } from "./pagos";

/*
  =====================================================
  EGRESOS (RF-26, RF-27)
  =====================================================
*/

export interface CategoriaEgreso {
  id: string;
  nombre: string;
  activa: boolean;
}

export interface Egreso {
  id: string;
  categoriaId: string;
  concepto: string;
  valor: number;
  fecha: string; // YYYY-MM-DD
  usuarioRegistro: string;
}

export const categoriasEgresoIniciales: CategoriaEgreso[] = [
  { id: "cat-001", nombre: "Nómina", activa: true },
  { id: "cat-002", nombre: "Mantenimiento", activa: true },
  { id: "cat-003", nombre: "Servicios públicos", activa: true },
  { id: "cat-004", nombre: "Insumos de aseo/antibacteriales", activa: true },
  { id: "cat-005", nombre: "Otro", activa: true },
];

export const egresosIniciales: Egreso[] = [
  {
    id: "egr-001",
    categoriaId: "cat-001",
    concepto: "Nómina mes de agosto",
    valor: 1500000,
    fecha: "2026-08-30",
    usuarioRegistro: "apexg",
  },
  {
    id: "egr-002",
    categoriaId: "cat-003",
    concepto: "Energía y agua",
    valor: 420000,
    fecha: "2026-08-05",
    usuarioRegistro: "apexg",
  },
];

export function validarCategoriaEgreso(categoria: CategoriaEgreso): string[] {
  const errores: string[] = [];

  if (!categoria.nombre.trim()) {
    errores.push("El nombre de la categoría es obligatorio.");
  }

  return errores;
}

export function validarEgreso(egreso: Egreso): string[] {
  const errores: string[] = [];

  if (!egreso.concepto.trim()) {
    errores.push("El concepto del egreso es obligatorio.");
  }

  if (egreso.valor <= 0) {
    errores.push("El valor del egreso debe ser mayor a 0.");
  }

  if (!egreso.fecha) {
    errores.push("La fecha del egreso es obligatoria.");
  }

  if (!egreso.categoriaId) {
    errores.push("Debe seleccionar una categoría de egreso.");
  }

  return errores;
}

/*
  =====================================================
  BALANCE FINANCIERO (RF-31, RF-33)
  =====================================================
*/

export interface Balance {
  ingresos: number;
  egresos: number;
  utilidad: number;
  clientesActivos: number;
  clientesEnMora: number;
}

function dentroDeRango(fecha: string, desde: string, hasta: string): boolean {
  return fecha >= desde && fecha <= hasta;
}

// YYYY-MM-DD → lunes de esa semana, en formato YYYY-MM-DD.
function inicioSemana(fechaISO: string): string {
  const fecha = new Date(`${fechaISO}T00:00:00.000Z`);
  const diaSemana = fecha.getUTCDay(); // 0 = domingo
  const diff = diaSemana === 0 ? 6 : diaSemana - 1;
  fecha.setUTCDate(fecha.getUTCDate() - diff);
  return fecha.toISOString().slice(0, 10);
}

function finSemana(fechaISO: string): string {
  const fecha = new Date(`${inicioSemana(fechaISO)}T00:00:00.000Z`);
  fecha.setUTCDate(fecha.getUTCDate() + 6);
  return fecha.toISOString().slice(0, 10);
}

export function calcularBalance(
  pagos: Pago[],
  egresos: Egreso[],
  clientes: Cliente[],
  periodo: "dia" | "semana" | "mes",
  fechaReferencia: string
): Balance {
  let desde = fechaReferencia;
  let hasta = fechaReferencia;

  if (periodo === "semana") {
    desde = inicioSemana(fechaReferencia);
    hasta = finSemana(fechaReferencia);
  }

  if (periodo === "mes") {
    desde = `${fechaReferencia.slice(0, 7)}-01`;
    hasta = `${fechaReferencia.slice(0, 7)}-31`;
  }

  const ingresos = pagos
    .filter((pago) => dentroDeRango(pago.fecha, desde, hasta))
    .reduce((total, pago) => total + pago.valorPagado, 0);

  const egresosTotal = egresos
    .filter((egreso) => dentroDeRango(egreso.fecha, desde, hasta))
    .reduce((total, egreso) => total + egreso.valor, 0);

  return {
    ingresos,
    egresos: egresosTotal,
    utilidad: ingresos - egresosTotal,
    clientesActivos: clientes.filter((cliente) => cliente.estado === "Activo").length,
    clientesEnMora: clientes.filter((cliente) => cliente.estado === "En mora").length,
  };
}

// RF-32: utilidad del mes en curso frente al mes anterior.
export function compararConMesAnterior(
  pagos: Pago[],
  egresos: Egreso[],
  clientes: Cliente[],
  mesActualISO: string // YYYY-MM
): { actual: Balance; anterior: Balance; variacionPorcentaje: number } {
  const fechaActual = `${mesActualISO}-01`;

  const fechaAnteriorDate = new Date(`${fechaActual}T00:00:00.000Z`);
  fechaAnteriorDate.setUTCMonth(fechaAnteriorDate.getUTCMonth() - 1);
  const fechaAnterior = fechaAnteriorDate.toISOString().slice(0, 10);

  const actual = calcularBalance(pagos, egresos, clientes, "mes", fechaActual);
  const anterior = calcularBalance(pagos, egresos, clientes, "mes", fechaAnterior);

  const variacionPorcentaje =
    anterior.utilidad === 0
      ? actual.utilidad === 0
        ? 0
        : 100
      : Math.round(((actual.utilidad - anterior.utilidad) / Math.abs(anterior.utilidad)) * 100);

  return { actual, anterior, variacionPorcentaje };
}

/*
  =====================================================
  APARTADO DIARIO / BITACORA (RF-34)
  =====================================================
*/

export interface NovedadDiaria {
  id: string;
  fecha: string; // YYYY-MM-DD
  descripcion: string;
  usuarioRegistro: string;
}

export function clientesNuevosDelDia(clientes: Cliente[], fecha: string) {
  return clientes
    .filter((cliente) => cliente.fechaIngreso === fecha)
    .map((cliente) => ({
      id: cliente.id,
      nombre: cliente.nombre,
      telefono: cliente.telefono,
      formaPago: cliente.formaPago,
      membresiaId: cliente.membresiaId,
    }));
}

export function ingresosDelDia(pagos: Pago[], fecha: string): number {
  return pagos
    .filter((pago) => pago.fecha === fecha)
    .reduce((total, pago) => total + pago.valorPagado, 0);
}

/*
  =====================================================
  SECCIONES DEL MODULO DE FINANZAS
  =====================================================
*/

export type SeccionFinanzas =
  | "dashboard"
  | "balance-mensual"
  | "apartado-diario"
  | "egresos"
  | "inventario"
  | "comisiones-entrenadores";

export const seccionesFinanzas: Array<{
  value: SeccionFinanzas;
  label: string;
  icono: NombreIcono;
}> = [
  { value: "dashboard", label: "Dashboard", icono: "grafico" },
  { value: "balance-mensual", label: "Balance mensual", icono: "tendencia" },
  { value: "apartado-diario", label: "Apartado diario", icono: "calendario" },
  { value: "egresos", label: "Egresos", icono: "billetera" },
  { value: "inventario", label: "Inventario", icono: "paquete" },
  { value: "comisiones-entrenadores", label: "Comisiones", icono: "mancuerna" },
];

export const seccionFinanzasPorDefecto: SeccionFinanzas = "dashboard";

export function esSeccionFinanzas(valor: string): boolean {
  return seccionesFinanzas.some((item) => item.value === valor);
}

export function tituloSeccionFinanzas(seccion: string): string {
  const item = seccionesFinanzas.find((s) => s.value === seccion);
  return item?.label ?? "Finanzas";
}
