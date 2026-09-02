"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import {
  CLAVES_ALMACENAMIENTO,
  calcularBalance,
  categoriasEgresoIniciales,
  clientesIniciales,
  clientesNuevosDelDia,
  compararConMesAnterior,
  egresosIniciales,
  ingresosDelDia,
  pagosIniciales,
  tituloSeccionFinanzas,
  validarCategoriaEgreso,
  validarEgreso,
  type CategoriaEgreso,
  type Cliente,
  type ComisionEntrenador,
  type Egreso,
  type NovedadDiaria,
  type Pago,
} from "@apexg/core";
import { Button, Card, CardBody, Input, Modal } from "@apexg/ui";

function moneda(valor: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(valor);
}

function leerLista<T>(clave: string, valorInicial: T[]): T[] {
  if (typeof window === "undefined") return valorInicial;

  const guardado = window.localStorage.getItem(clave);
  if (!guardado) return valorInicial;

  try {
    return JSON.parse(guardado) as T[];
  } catch {
    window.localStorage.removeItem(clave);
    return valorInicial;
  }
}

function guardarLista<T>(clave: string, valor: T[]) {
  window.localStorage.setItem(clave, JSON.stringify(valor));
}

function useDatosFinancieros() {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [egresos, setEgresos] = useState<Egreso[]>([]);
  const [categorias, setCategorias] = useState<CategoriaEgreso[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [comisiones, setComisiones] = useState<ComisionEntrenador[]>([]);
  const [novedades, setNovedades] = useState<NovedadDiaria[]>([]);
  const [observaciones, setObservaciones] = useState<Record<string, string>>({});

  useEffect(() => {
    // oxlint-disable react/set-state-in-effect
    setPagos(leerLista(CLAVES_ALMACENAMIENTO.pagos, pagosIniciales));
    setEgresos(leerLista(CLAVES_ALMACENAMIENTO.egresos, egresosIniciales));
    setCategorias(leerLista(CLAVES_ALMACENAMIENTO.categoriasEgreso, categoriasEgresoIniciales));
    setClientes(leerLista(CLAVES_ALMACENAMIENTO.clientes, clientesIniciales));
    setComisiones(leerLista(CLAVES_ALMACENAMIENTO.comisiones, []));
    setNovedades(leerLista(CLAVES_ALMACENAMIENTO.novedadesDiarias, []));
    // oxlint-enable react/set-state-in-effect

    const guardado = window.localStorage.getItem(CLAVES_ALMACENAMIENTO.observacionesCierre);
    if (guardado) {
      try {
        // oxlint-disable-next-line react/set-state-in-effect
        setObservaciones(JSON.parse(guardado) as Record<string, string>);
      } catch {
        window.localStorage.removeItem(CLAVES_ALMACENAMIENTO.observacionesCierre);
      }
    }
  }, []);

  return {
    pagos,
    egresos,
    setEgresos: (valor: Egreso[]) => {
      setEgresos(valor);
      guardarLista(CLAVES_ALMACENAMIENTO.egresos, valor);
    },
    categorias,
    setCategorias: (valor: CategoriaEgreso[]) => {
      setCategorias(valor);
      guardarLista(CLAVES_ALMACENAMIENTO.categoriasEgreso, valor);
    },
    clientes,
    comisiones,
    novedades,
    setNovedades: (valor: NovedadDiaria[]) => {
      setNovedades(valor);
      guardarLista(CLAVES_ALMACENAMIENTO.novedadesDiarias, valor);
    },
    observaciones,
    setObservaciones: (valor: Record<string, string>) => {
      setObservaciones(valor);
      window.localStorage.setItem(
        CLAVES_ALMACENAMIENTO.observacionesCierre,
        JSON.stringify(valor)
      );
    },
  };
}

interface FinanzasProps {
  activeSection: string;
}

export default function Finanzas({ activeSection }: FinanzasProps) {
  const datos = useDatosFinancieros();
  const tituloVista = tituloSeccionFinanzas(activeSection);
  const hoy = new Date().toISOString().slice(0, 10);

  if (activeSection === "dashboard") {
    return (
      <VistaDashboard
        titulo={tituloVista}
        pagos={datos.pagos}
        egresos={datos.egresos}
        clientes={datos.clientes}
        hoy={hoy}
      />
    );
  }

  if (activeSection === "balance-mensual") {
    return (
      <VistaBalanceMensual
        titulo={tituloVista}
        pagos={datos.pagos}
        egresos={datos.egresos}
        clientes={datos.clientes}
        observaciones={datos.observaciones}
        setObservaciones={datos.setObservaciones}
        hoy={hoy}
      />
    );
  }

  if (activeSection === "apartado-diario") {
    return (
      <VistaApartadoDiario
        titulo={tituloVista}
        pagos={datos.pagos}
        clientes={datos.clientes}
        novedades={datos.novedades}
        setNovedades={datos.setNovedades}
        hoy={hoy}
      />
    );
  }

  if (activeSection === "egresos") {
    return (
      <VistaEgresos
        titulo={tituloVista}
        egresos={datos.egresos}
        setEgresos={datos.setEgresos}
        categorias={datos.categorias}
        setCategorias={datos.setCategorias}
      />
    );
  }

  if (activeSection === "inventario") {
    return <VistaInventarioResumen titulo={tituloVista} />;
  }

  if (activeSection === "comisiones-entrenadores") {
    return <VistaComisiones titulo={tituloVista} comisiones={datos.comisiones} />;
  }

  return null;
}

/* =====================================================
   DASHBOARD (RF-35)
===================================================== */

function VistaDashboard({
  titulo,
  pagos,
  egresos,
  clientes,
  hoy,
}: {
  titulo: string;
  pagos: Pago[];
  egresos: Egreso[];
  clientes: Cliente[];
  hoy: string;
}) {
  const comparacion = compararConMesAnterior(pagos, egresos, clientes, hoy.slice(0, 7));

  return (
    <div className="p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">{titulo}</h1>
          <p className="mt-2 text-slate-500">Indicadores clave del negocio (RF-35).</p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <TarjetaKpi
            titulo="Ingresos del mes"
            valor={moneda(comparacion.actual.ingresos)}
            descripcion={`${comparacion.variacionPorcentaje >= 0 ? "+" : ""}${comparacion.variacionPorcentaje}% vs. mes anterior`}
          />
          <TarjetaKpi
            titulo="Clientes activos"
            valor={String(comparacion.actual.clientesActivos)}
            descripcion="Con membresía vigente"
          />
          <TarjetaKpi
            titulo="Clientes en mora"
            valor={String(comparacion.actual.clientesEnMora)}
            descripcion="Requieren seguimiento"
          />
          <TarjetaKpi
            titulo="Utilidad del mes"
            valor={moneda(comparacion.actual.utilidad)}
            descripcion={`Mes anterior: ${moneda(comparacion.anterior.utilidad)}`}
          />
        </div>
      </div>
    </div>
  );
}

function TarjetaKpi({
  titulo,
  valor,
  descripcion,
}: {
  titulo: string;
  valor: string;
  descripcion: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{titulo}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{valor}</p>
      <p className="mt-3 text-xs text-slate-500">{descripcion}</p>
    </div>
  );
}

/* =====================================================
   BALANCE MENSUAL (RF-31, RF-32)
===================================================== */

function VistaBalanceMensual({
  titulo,
  pagos,
  egresos,
  clientes,
  observaciones,
  setObservaciones,
  hoy,
}: {
  titulo: string;
  pagos: Pago[];
  egresos: Egreso[];
  clientes: Cliente[];
  observaciones: Record<string, string>;
  setObservaciones: (valor: Record<string, string>) => void;
  hoy: string;
}) {
  const mesActual = hoy.slice(0, 7);
  const balanceDia = calcularBalance(pagos, egresos, clientes, "dia", hoy);
  const balanceSemana = calcularBalance(pagos, egresos, clientes, "semana", hoy);
  const comparacion = compararConMesAnterior(pagos, egresos, clientes, mesActual);

  const [textoObservacion, setTextoObservacion] = useState(observaciones[mesActual] ?? "");

  return (
    <div className="p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">{titulo}</h1>
          <p className="mt-2 text-slate-500">
            Balance de ingresos frente a egresos, por día, semana y mes.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <PanelBalance titulo="Día actual" balance={balanceDia} />
          <PanelBalance titulo="Semana actual" balance={balanceSemana} />
          <PanelBalance titulo="Mes actual" balance={comparacion.actual} />
        </div>

        <Card>
          <CardBody>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                Utilidad acumulada vs. mes anterior
              </h2>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  comparacion.variacionPorcentaje >= 0
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {comparacion.variacionPorcentaje >= 0 ? "+" : ""}
                {comparacion.variacionPorcentaje}%
              </span>
            </div>
            <p className="text-sm text-slate-600">
              Mes actual: <strong>{moneda(comparacion.actual.utilidad)}</strong> · Mes anterior:{" "}
              <strong>{moneda(comparacion.anterior.utilidad)}</strong>
            </p>

            <div className="mt-6">
              <label
                htmlFor="observaciones-cierre"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Observaciones al cierre del mes (ej. pagos pendientes)
              </label>
              <textarea
                id="observaciones-cierre"
                value={textoObservacion}
                onChange={(event) => setTextoObservacion(event.target.value)}
                onBlur={() =>
                  setObservaciones({ ...observaciones, [mesActual]: textoObservacion })
                }
                rows={3}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-blue-500"
              />
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function PanelBalance({
  titulo,
  balance,
}: {
  titulo: string;
  balance: { ingresos: number; egresos: number; utilidad: number };
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-slate-500">{titulo}</p>
      <div className="mt-3 space-y-1 text-sm">
        <p className="flex justify-between text-slate-600">
          <span>Ingresos</span>
          <span className="font-semibold text-emerald-600">{moneda(balance.ingresos)}</span>
        </p>
        <p className="flex justify-between text-slate-600">
          <span>Egresos</span>
          <span className="font-semibold text-red-600">{moneda(balance.egresos)}</span>
        </p>
        <p className="flex justify-between border-t border-slate-100 pt-1 text-slate-900">
          <span className="font-semibold">Utilidad</span>
          <span className="font-bold">{moneda(balance.utilidad)}</span>
        </p>
      </div>
    </div>
  );
}

/* =====================================================
   APARTADO DIARIO (RF-34)
===================================================== */

function VistaApartadoDiario({
  titulo,
  pagos,
  clientes,
  novedades,
  setNovedades,
  hoy,
}: {
  titulo: string;
  pagos: Pago[];
  clientes: Cliente[];
  novedades: NovedadDiaria[];
  setNovedades: (valor: NovedadDiaria[]) => void;
  hoy: string;
}) {
  const [texto, setTexto] = useState("");

  const ingresos = ingresosDelDia(pagos, hoy);
  const clientesNuevos = clientesNuevosDelDia(clientes, hoy);
  const novedadesHoy = novedades.filter((novedad) => novedad.fecha === hoy);

  const agregarNovedad = () => {
    if (!texto.trim()) return;

    const nueva: NovedadDiaria = {
      id: `nov-${Date.now()}`,
      fecha: hoy,
      descripcion: texto.trim(),
      usuarioRegistro: "apexg",
    };

    setNovedades([nueva, ...novedades]);
    setTexto("");
  };

  return (
    <div className="p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">{titulo}</h1>
          <p className="mt-2 text-slate-500">Bitácora del día {hoy}.</p>
        </div>

        <div className="mb-6 grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Ingresos del día</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{moneda(ingresos)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Clientes nuevos hoy</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{clientesNuevos.length}</p>
          </div>
        </div>

        <Card>
          <CardBody>
            <h2 className="mb-4 text-lg font-bold text-slate-900">Clientes nuevos registrados</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="px-4 py-3 font-semibold">Nombre</th>
                    <th className="px-4 py-3 font-semibold">Teléfono</th>
                    <th className="px-4 py-3 font-semibold">Forma de pago</th>
                    <th className="px-4 py-3 font-semibold">Membresía</th>
                  </tr>
                </thead>
                <tbody>
                  {clientesNuevos.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100">
                      <td className="px-4 py-4 font-semibold text-slate-900">{item.nombre}</td>
                      <td className="px-4 py-4 text-slate-600">{item.telefono}</td>
                      <td className="px-4 py-4 text-slate-600">{item.formaPago}</td>
                      <td className="px-4 py-4 text-slate-600">{item.membresiaId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {clientesNuevos.length === 0 && (
                <p className="py-6 text-center text-slate-500">
                  Ningún cliente nuevo registrado hoy.
                </p>
              )}
            </div>
          </CardBody>
        </Card>

        <div className="mt-6">
          <Card>
            <CardBody>
              <h2 className="mb-4 text-lg font-bold text-slate-900">Novedades del día</h2>

              <div className="mb-4 flex gap-3">
                <Input
                  id="nueva-novedad"
                  value={texto}
                  onChange={(event) => setTexto(event.target.value)}
                  placeholder="Ej. Se atendió reclamo de un cliente..."
                  className="flex-1"
                />
                <Button type="button" onClick={agregarNovedad}>
                  <Plus size={18} />
                  Agregar
                </Button>
              </div>

              <ul className="space-y-2">
                {novedadesHoy.map((novedad) => (
                  <li
                    key={novedad.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                  >
                    {novedad.descripcion}
                  </li>
                ))}
              </ul>

              {novedadesHoy.length === 0 && (
                <p className="py-4 text-center text-slate-500">Sin novedades registradas hoy.</p>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* =====================================================
   EGRESOS (RF-26, RF-27)
===================================================== */

function VistaEgresos({
  titulo,
  egresos,
  setEgresos,
  categorias,
  setCategorias,
}: {
  titulo: string;
  egresos: Egreso[];
  setEgresos: (valor: Egreso[]) => void;
  categorias: CategoriaEgreso[];
  setCategorias: (valor: CategoriaEgreso[]) => void;
}) {
  const [creando, setCreando] = useState(false);
  const [gestionandoCategorias, setGestionandoCategorias] = useState(false);
  const [nuevaCategoria, setNuevaCategoria] = useState("");
  const [errores, setErrores] = useState<string[]>([]);
  const [formulario, setFormulario] = useState<Egreso>({
    id: "",
    categoriaId: categorias[0]?.id ?? "",
    concepto: "",
    valor: 0,
    fecha: new Date().toISOString().slice(0, 10),
    usuarioRegistro: "apexg",
  });

  const total = useMemo(() => egresos.reduce((acc, item) => acc + item.valor, 0), [egresos]);

  const guardar = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const egreso: Egreso = { ...formulario, id: formulario.id || `egr-${Date.now()}` };
    const validaciones = validarEgreso(egreso);

    if (validaciones.length) {
      setErrores(validaciones);
      return;
    }

    setEgresos([egreso, ...egresos]);
    setCreando(false);
    setErrores([]);
    setFormulario({
      id: "",
      categoriaId: categorias[0]?.id ?? "",
      concepto: "",
      valor: 0,
      fecha: new Date().toISOString().slice(0, 10),
      usuarioRegistro: "apexg",
    });
  };

  const agregarCategoria = () => {
    const categoria: CategoriaEgreso = {
      id: `cat-${Date.now()}`,
      nombre: nuevaCategoria,
      activa: true,
    };

    const validaciones = validarCategoriaEgreso(categoria);
    if (validaciones.length) return;

    setCategorias([...categorias, categoria]);
    setNuevaCategoria("");
  };

  const eliminarCategoria = (id: string) => {
    setCategorias(categorias.filter((categoria) => categoria.id !== id));
  };

  return (
    <div className="p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{titulo}</h1>
            <p className="mt-2 text-slate-500">Registra egresos por categoría, concepto y valor.</p>
          </div>
          <div className="flex gap-3">
            <Button variante="secundario" onClick={() => setGestionandoCategorias(true)}>
              Categorías
            </Button>
            <Button onClick={() => setCreando(true)}>
              <Plus size={18} />
              Nuevo egreso
            </Button>
          </div>
        </div>

        {creando && (
          <Modal abierto={creando} titulo="Nuevo egreso" onCerrar={() => setCreando(false)}>
            <form onSubmit={guardar} className="space-y-5">
              {errores.length > 0 && (
                <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
                  {errores.map((error) => (
                    <p key={error}>{error}</p>
                  ))}
                </div>
              )}

              <div>
                <label
                  htmlFor="categoria-egreso"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Categoría
                </label>
                <select
                  id="categoria-egreso"
                  value={formulario.categoriaId}
                  onChange={(event) =>
                    setFormulario({ ...formulario, categoriaId: event.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900"
                >
                  {categorias
                    .filter((categoria) => categoria.activa)
                    .map((categoria) => (
                      <option key={categoria.id} value={categoria.id}>
                        {categoria.nombre}
                      </option>
                    ))}
                </select>
              </div>

              <Input
                etiqueta="Concepto / justificación"
                id="concepto"
                value={formulario.concepto}
                onChange={(event) => setFormulario({ ...formulario, concepto: event.target.value })}
                required
              />

              <div className="grid gap-5 md:grid-cols-2">
                <Input
                  etiqueta="Valor"
                  id="valor"
                  type="number"
                  min="1"
                  value={formulario.valor || ""}
                  onChange={(event) =>
                    setFormulario({ ...formulario, valor: Number(event.target.value) })
                  }
                  required
                />
                <Input
                  etiqueta="Fecha"
                  id="fecha"
                  type="date"
                  value={formulario.fecha}
                  onChange={(event) => setFormulario({ ...formulario, fecha: event.target.value })}
                  required
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit">
                  <Plus size={18} />
                  Guardar egreso
                </Button>
                <Button type="button" variante="secundario" onClick={() => setCreando(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </Modal>
        )}

        {gestionandoCategorias && (
          <Modal
            abierto={gestionandoCategorias}
            titulo="Categorías de egreso"
            onCerrar={() => setGestionandoCategorias(false)}
          >
            <div className="mb-4 flex gap-3">
              <Input
                id="nueva-categoria"
                value={nuevaCategoria}
                onChange={(event) => setNuevaCategoria(event.target.value)}
                placeholder="Nueva categoría"
                className="flex-1"
              />
              <Button type="button" onClick={agregarCategoria}>
                <Plus size={18} />
              </Button>
            </div>

            <ul className="space-y-2">
              {categorias.map((categoria) => (
                <li
                  key={categoria.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
                >
                  {categoria.nombre}
                  <button
                    type="button"
                    onClick={() => eliminarCategoria(categoria.id)}
                    className="text-slate-400 transition hover:text-red-600"
                    aria-label={`Eliminar ${categoria.nombre}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          </Modal>
        )}

        <Card>
          <CardBody>
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-slate-500">Total egresos</p>
              <p className="text-2xl font-bold text-slate-900">{moneda(total)}</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="px-4 py-3 font-semibold">Concepto</th>
                    <th className="px-4 py-3 font-semibold">Categoría</th>
                    <th className="px-4 py-3 font-semibold">Valor</th>
                    <th className="px-4 py-3 font-semibold">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {egresos.map((egreso) => (
                    <tr key={egreso.id} className="border-b border-slate-100">
                      <td className="px-4 py-4 font-semibold text-slate-900">{egreso.concepto}</td>
                      <td className="px-4 py-4 text-slate-600">
                        {categorias.find((cat) => cat.id === egreso.categoriaId)?.nombre ?? "—"}
                      </td>
                      <td className="px-4 py-4 font-semibold text-slate-900">
                        {moneda(egreso.valor)}
                      </td>
                      <td className="px-4 py-4 text-slate-600">{egreso.fecha}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {egresos.length === 0 && (
                <p className="py-10 text-center text-slate-500">No hay egresos registrados.</p>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

/* =====================================================
   RESUMEN DE INVENTARIO (enlace al modulo Inventario)
===================================================== */

function VistaInventarioResumen({ titulo }: { titulo: string }) {
  return (
    <div className="p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-slate-900">{titulo}</h1>
        <p className="mt-2 text-slate-500">
          El control detallado de productos y existencias vive en el módulo Inventario. Aquí solo
          se resume el impacto financiero del inventario en el balance mensual.
        </p>
      </div>
    </div>
  );
}

/* =====================================================
   COMISIONES DE ENTRENADORES (vista consolidada)
===================================================== */

function VistaComisiones({
  titulo,
  comisiones,
}: {
  titulo: string;
  comisiones: ComisionEntrenador[];
}) {
  const total = comisiones.reduce((acc, item) => acc + item.valorEntrenador, 0);

  return (
    <div className="p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">{titulo}</h1>
          <p className="mt-2 text-slate-500">
            Vista consolidada de comisiones (detalle completo en el módulo Entrenadores).
          </p>
        </div>

        <Card>
          <CardBody>
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-slate-500">Total comisiones</p>
              <p className="text-2xl font-bold text-slate-900">{moneda(total)}</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="px-4 py-3 font-semibold">Entrenador</th>
                    <th className="px-4 py-3 font-semibold">Cliente</th>
                    <th className="px-4 py-3 font-semibold">Valor</th>
                    <th className="px-4 py-3 font-semibold">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {comisiones.map((comision) => (
                    <tr key={comision.id} className="border-b border-slate-100">
                      <td className="px-4 py-4 font-semibold text-slate-900">
                        {comision.entrenadorNombre}
                      </td>
                      <td className="px-4 py-4 text-slate-600">{comision.clienteNombre}</td>
                      <td className="px-4 py-4 font-semibold text-slate-900">
                        {moneda(comision.valorEntrenador)}
                      </td>
                      <td className="px-4 py-4 text-slate-600">{comision.fecha}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {comisiones.length === 0 && (
                <p className="py-10 text-center text-slate-500">Aún no hay comisiones registradas.</p>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
