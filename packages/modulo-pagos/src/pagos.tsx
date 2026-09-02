"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";

import {
  CLAVES_ALMACENAMIENTO,
  calcularSaldoPendiente,
  calcularVencimientoCliente,
  clientesIniciales,
  determinarTipoAbono,
  entrenadoresIniciales,
  generarCicloId,
  metodosPago,
  planesMembresiaIniciales,
  tituloSeccionPagos,
  validarAbono,
  type Cliente,
  type ComisionEntrenador,
  type MetodoPago,
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

interface PagosProps {
  activeSection: string;
}

export default function Pagos({ activeSection }: PagosProps) {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>(clientesIniciales);
  const [busqueda, setBusqueda] = useState("");
  const [registrando, setRegistrando] = useState(false);
  const [clienteId, setClienteId] = useState<number | "">("");
  const [monto, setMonto] = useState(0);
  const [metodo, setMetodo] = useState<MetodoPago>("efectivo");
  const [referencia, setReferencia] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [errores, setErrores] = useState<string[]>([]);

  useEffect(() => {
    setPagos(leerLista(CLAVES_ALMACENAMIENTO.pagos, []));
    setClientes(leerLista(CLAVES_ALMACENAMIENTO.clientes, clientesIniciales));
  }, []);

  useEffect(() => {
    if (activeSection === "registrar") {
      setRegistrando(true);
    }
    // Solo al entrar a la sección "registrar" mediante la URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection]);

  const cliente = clientes.find((item) => item.id === clienteId) ?? null;
  const plan = cliente ? planesMembresiaIniciales.find((p) => p.id === cliente.membresiaId) : null;
  const cicloId = cliente ? generarCicloId(cliente.id, cliente.fechaIngreso) : "";
  const saldoPendienteAntes = plan && cliente ? calcularSaldoPendiente(pagos, cicloId, plan.valor) : 0;
  const abonosPreviosCiclo = pagos.filter((pago) => pago.cicloId === cicloId).length;

  const visibles = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    let resultado = pagos;

    if (activeSection === "con-saldo") {
      resultado = resultado.filter((pago) => pago.saldoPendiente > 0);
    }

    if (!termino) return resultado;

    return resultado.filter((pago) =>
      `${pago.clienteNombre} ${pago.membresiaNombre} ${pago.referencia}`
        .toLowerCase()
        .includes(termino)
    );
  }, [activeSection, busqueda, pagos]);

  const tituloVista = tituloSeccionPagos(activeSection);

  const limpiarFormulario = () => {
    setClienteId("");
    setMonto(0);
    setMetodo("efectivo");
    setReferencia("");
    setObservaciones("");
    setErrores([]);
  };

  const abrirRegistro = () => {
    limpiarFormulario();
    setRegistrando(true);
  };

  const guardar = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!cliente || !plan) {
      setErrores(["Debes seleccionar un cliente."]);
      return;
    }

    const montoNumerico = Number(monto);
    const validaciones = validarAbono(montoNumerico, plan, saldoPendienteAntes);

    if (!referencia.trim()) {
      validaciones.push("La referencia del pago es obligatoria.");
    }

    if (validaciones.length) {
      setErrores(validaciones);
      return;
    }

    const saldoPendienteDespues = Math.max(saldoPendienteAntes - montoNumerico, 0);
    const tipoAbono = determinarTipoAbono(abonosPreviosCiclo, saldoPendienteDespues);
    const fechaHoy = new Date().toISOString().slice(0, 10);

    const nuevoPago: Pago = {
      id: `pago-${Date.now()}`,
      clienteId: cliente.id,
      clienteNombre: cliente.nombre,
      membresiaId: plan.id,
      membresiaNombre: plan.nombre,
      cicloId,
      valorMembresia: plan.valor,
      valorPagado: montoNumerico,
      saldoPendiente: saldoPendienteDespues,
      tipoAbono,
      fecha: fechaHoy,
      metodo,
      referencia: referencia.trim(),
      usuarioRegistro: "apexg",
      observaciones,
    };

    const nuevosPagos = [nuevoPago, ...pagos];
    setPagos(nuevosPagos);
    window.localStorage.setItem(CLAVES_ALMACENAMIENTO.pagos, JSON.stringify(nuevosPagos));

    // RF-21: un pago que renueva la membresía saca al cliente de mora.
    // RF-16 / RN 4.4: si el plan requiere entrenador y el saldo queda en
    // cero, se registra automáticamente la comisión correspondiente.
    if (saldoPendienteDespues === 0) {
      const nuevoIngreso = cliente.estado === "En mora" ? fechaHoy : cliente.fechaIngreso;

      const clienteActualizado: Cliente = {
        ...cliente,
        estado: "Activo",
        fechaIngreso: nuevoIngreso,
        fechaVencimiento: calcularVencimientoCliente(nuevoIngreso, plan.id),
      };

      const nuevosClientes = clientes.map((item) =>
        item.id === cliente.id ? clienteActualizado : item
      );
      setClientes(nuevosClientes);
      window.localStorage.setItem(CLAVES_ALMACENAMIENTO.clientes, JSON.stringify(nuevosClientes));

      if (plan.requiereEntrenador && plan.distribucion && cliente.entrenadorId) {
        const entrenador = entrenadoresIniciales.find(
          (item) => item.id === cliente.entrenadorId
        );

        if (entrenador) {
          const comisiones = leerLista<ComisionEntrenador>(CLAVES_ALMACENAMIENTO.comisiones, []);

          const nuevaComision: ComisionEntrenador = {
            id: `com-${Date.now()}`,
            entrenadorId: entrenador.id,
            entrenadorNombre: entrenador.nombre,
            clienteId: cliente.id,
            clienteNombre: cliente.nombre,
            planId: plan.id,
            planNombre: plan.nombre,
            valorEntrenador: plan.distribucion.entrenador,
            valorNegocio: plan.distribucion.negocio,
            fecha: fechaHoy,
            pagoId: nuevoPago.id,
          };

          const nuevasComisiones = [nuevaComision, ...comisiones];
          window.localStorage.setItem(
            CLAVES_ALMACENAMIENTO.comisiones,
            JSON.stringify(nuevasComisiones)
          );
        }
      }
    }

    setRegistrando(false);
    limpiarFormulario();
  };

  return (
    <div className="p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{tituloVista}</h1>
            <p className="mt-2 text-slate-500">
              Registra pagos completos o abonos y controla el saldo pendiente de cada cliente.
            </p>
          </div>
          <Button onClick={abrirRegistro}>
            <Plus size={18} />
            Registrar pago
          </Button>
        </div>

        {registrando && (
          <Modal
            abierto={registrando}
            titulo="Registrar pago o abono"
            onCerrar={() => {
              setRegistrando(false);
              limpiarFormulario();
            }}
          >
            <form onSubmit={guardar} className="space-y-5">
              {errores.length > 0 && (
                <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
                  {errores.map((error) => (
                    <p key={error}>{error}</p>
                  ))}
                </div>
              )}

              <div>
                <label htmlFor="cliente" className="mb-2 block text-sm font-medium text-slate-700">
                  Cliente
                </label>
                <select
                  id="cliente"
                  value={clienteId}
                  onChange={(event) => setClienteId(Number(event.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900"
                  required
                >
                  <option value="">Selecciona un cliente</option>
                  {clientes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nombre} — {item.documento}
                    </option>
                  ))}
                </select>
              </div>

              {cliente && plan && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  <p>
                    Membresía: <strong className="text-slate-900">{plan.nombre}</strong> (
                    {moneda(plan.valor)})
                  </p>
                  <p className="mt-1">
                    Saldo pendiente actual:{" "}
                    <strong className="text-slate-900">{moneda(saldoPendienteAntes)}</strong>
                  </p>
                  {plan.abonoMinimo !== null ? (
                    <p className="mt-1">Abono mínimo: {moneda(plan.abonoMinimo)}</p>
                  ) : (
                    <p className="mt-1">Este plan no admite abonos: se paga completo.</p>
                  )}
                </div>
              )}

              <div className="grid gap-5 md:grid-cols-2">
                <Input
                  etiqueta="Monto a pagar"
                  id="monto"
                  type="number"
                  min="1"
                  value={monto || ""}
                  onChange={(event) => setMonto(Number(event.target.value))}
                  required
                />
                <Input
                  etiqueta="Referencia"
                  id="referencia"
                  value={referencia}
                  onChange={(event) => setReferencia(event.target.value)}
                  required
                />
              </div>

              <div>
                <label htmlFor="metodo" className="mb-2 block text-sm font-medium text-slate-700">
                  Método de pago
                </label>
                <select
                  id="metodo"
                  value={metodo}
                  onChange={(event) => setMetodo(event.target.value as MetodoPago)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900"
                >
                  {metodosPago.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="observaciones"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Observaciones
                </label>
                <textarea
                  id="observaciones"
                  value={observaciones}
                  onChange={(event) => setObservaciones(event.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit">
                  <Plus size={18} />
                  Guardar pago
                </Button>
                <Button
                  type="button"
                  variante="secundario"
                  onClick={() => {
                    setRegistrando(false);
                    limpiarFormulario();
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </Modal>
        )}

        <Card>
          <CardBody>
            <div className="mb-6">
              <Input
                id="buscar-pago"
                etiqueta="Buscar pago"
                icono={<Search size={18} />}
                placeholder="Cliente, membresía o referencia"
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="px-4 py-3 font-semibold">Cliente</th>
                    <th className="px-4 py-3 font-semibold">Membresía</th>
                    <th className="px-4 py-3 font-semibold">Monto</th>
                    <th className="px-4 py-3 font-semibold">Tipo de abono</th>
                    <th className="px-4 py-3 font-semibold">Saldo pendiente</th>
                    <th className="px-4 py-3 font-semibold">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {visibles.map((pago) => (
                    <tr key={pago.id} className="border-b border-slate-100">
                      <td className="px-4 py-4">
                        <p className="font-semibold text-slate-900">{pago.clienteNombre}</p>
                        <p className="mt-1 text-slate-500">{pago.referencia}</p>
                      </td>
                      <td className="px-4 py-4 text-slate-600">{pago.membresiaNombre}</td>
                      <td className="px-4 py-4 font-semibold text-slate-900">
                        {moneda(pago.valorPagado)}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            pago.tipoAbono === "completo" || pago.tipoAbono === "abono final"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {pago.tipoAbono}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {pago.saldoPendiente > 0 ? moneda(pago.saldoPendiente) : "—"}
                      </td>
                      <td className="px-4 py-4 text-slate-600">{pago.fecha}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {visibles.length === 0 && (
                <p className="py-10 text-center text-slate-500">
                  No hay pagos que coincidan con la búsqueda.
                </p>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
