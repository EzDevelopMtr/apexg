"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";

import {
  planesMembresiaIniciales,
  type PlanMembresia,
  type TipoVigencia,
  tituloSeccionMembresias,
  validarPlanMembresia,
} from "@apexg/core";
import { Button, Card, CardBody, Input, Modal } from "@apexg/ui";

const CLAVE_PLANES = "apexg:planes-membresia";

function moneda(valor: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(valor);
}

function formularioVacio(): PlanMembresia {
  return {
    id: "",
    nombre: "",
    tipo: "regular",
    valor: 0,
    condiciones: "",
    vigencia: { tipo: "meses", cantidad: 1 },
    abonoMinimo: null,
    promocion: null,
    requiereEntrenador: false,
    distribucion: null,
    activo: true,
  };
}

interface MembresiasProps {
  activeSection: string;
}

export default function Membresias({ activeSection }: MembresiasProps) {
  const [planes, setPlanes] = useState<PlanMembresia[]>(planesMembresiaIniciales);
  const [busqueda, setBusqueda] = useState("");
  const [creando, setCreando] = useState(false);
  const [editando, setEditando] = useState<PlanMembresia | null>(null);
  const [pendienteEliminar, setPendienteEliminar] = useState<PlanMembresia | null>(null);
  const [formulario, setFormulario] = useState<PlanMembresia>(formularioVacio);
  const [errores, setErrores] = useState<string[]>([]);

  useEffect(() => {
    const guardados = window.localStorage.getItem(CLAVE_PLANES);
    if (!guardados) return;
    try {
      // oxlint-disable-next-line react/set-state-in-effect
      setPlanes(JSON.parse(guardados) as PlanMembresia[]);
    } catch {
      window.localStorage.removeItem(CLAVE_PLANES);
    }
  }, []);

  const guardarPlanes = (nuevos: PlanMembresia[]) => {
    setPlanes(nuevos);
    window.localStorage.setItem(CLAVE_PLANES, JSON.stringify(nuevos));
  };

  const visibles = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    let resultado = planes;

    if (activeSection === "activos") {
      resultado = resultado.filter((plan) => plan.activo);
    }

    if (activeSection === "inactivos") {
      resultado = resultado.filter((plan) => !plan.activo);
    }

    if (!termino) return resultado;
    return resultado.filter((plan) =>
      `${plan.nombre} ${plan.condiciones}`.toLowerCase().includes(termino)
    );
  }, [activeSection, busqueda, planes]);

  const tituloVista = tituloSeccionMembresias(activeSection);

  const abrirNuevo = () => {
    setErrores([]);
    setPendienteEliminar(null);
    setEditando(null);
    setCreando(true);
    setFormulario(formularioVacio());
  };

  const abrirEdicion = (plan: PlanMembresia) => {
    setErrores([]);
    setPendienteEliminar(null);
    setCreando(false);
    setEditando(plan);
    setFormulario(plan);
  };

  const guardar = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const plan = {
      ...formulario,
      id: formulario.id || `plan-${Date.now()}`,
      valor: Number(formulario.valor),
      vigencia: {
        ...formulario.vigencia,
        cantidad: Number(formulario.vigencia.cantidad),
      },
      abonoMinimo:
        formulario.abonoMinimo === null
          ? null
          : Number(formulario.abonoMinimo),
    } as PlanMembresia;
    const validaciones = validarPlanMembresia(plan);
    if (validaciones.length) {
      setErrores(validaciones);
      return;
    }
    guardarPlanes(editando ? planes.map((item) => item.id === plan.id ? plan : item) : [...planes, plan]);
    setEditando(null);
    setCreando(false);
    setFormulario(formularioVacio());
  };

  const eliminar = (plan: PlanMembresia) => {
    setPendienteEliminar(plan);
  };

  return (
    <div className="p-8"><div className="mx-auto max-w-7xl">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-bold text-slate-900">{tituloVista}</h1><p className="mt-2 text-slate-500">Administra los valores y condiciones de las membresías.</p></div><Button onClick={abrirNuevo}><Plus size={18} />Nuevo plan</Button></div>
      {(creando || editando) && <Modal abierto={creando || editando !== null} titulo={editando ? "Editar plan" : "Nuevo plan"} onCerrar={() => { setEditando(null); setCreando(false); setFormulario(formularioVacio()); }}><form onSubmit={guardar} className="space-y-5">
        {errores.length > 0 && <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{errores.map((error) => <p key={error}>{error}</p>)}</div>}
        <div className="grid gap-5 md:grid-cols-2"><Input etiqueta="Nombre del plan" id="nombre" value={formulario.nombre} onChange={(event) => setFormulario({ ...formulario, nombre: event.target.value })} required /><Input etiqueta="Valor" id="valor" type="number" min="1" value={formulario.valor || ""} onChange={(event) => setFormulario({ ...formulario, valor: Number(event.target.value) })} required /></div>
        <div className="grid gap-5 md:grid-cols-2"><Input etiqueta="Abono mínimo (opcional)" id="abono" type="number" min="0" value={formulario.abonoMinimo ?? ""} onChange={(event) => setFormulario({ ...formulario, abonoMinimo: event.target.value === "" ? null : Number(event.target.value) })} /><div><label htmlFor="vigencia-tipo" className="mb-2 block text-sm font-medium text-slate-700">Unidad de vigencia</label><select id="vigencia-tipo" value={formulario.vigencia.tipo} onChange={(event) => setFormulario({ ...formulario, vigencia: { ...formulario.vigencia, tipo: event.target.value as TipoVigencia } })} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900"><option value="dias">Días</option><option value="meses">Meses</option></select></div></div>
        <Input etiqueta="Cantidad de vigencia" id="vigencia-cantidad" type="number" min="1" value={formulario.vigencia.cantidad} onChange={(event) => setFormulario({ ...formulario, vigencia: { ...formulario.vigencia, cantidad: Number(event.target.value) } })} required /><div><label htmlFor="condiciones" className="mb-2 block text-sm font-medium text-slate-700">Condiciones</label><textarea id="condiciones" value={formulario.condiciones} onChange={(event) => setFormulario({ ...formulario, condiciones: event.target.value })} rows={3} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-blue-500" /></div>
        <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700"><input type="checkbox" checked={formulario.activo} onChange={(event) => setFormulario({ ...formulario, activo: event.target.checked })} className="h-4 w-4 accent-blue-600" />Plan activo</label>
        <div className="flex gap-3"><Button type="submit"><Plus size={18} />Guardar plan</Button><Button type="button" variante="secundario" onClick={() => { setEditando(null); setCreando(false); setFormulario(formularioVacio()); }}>Cancelar</Button></div>
      </form></Modal>}
      {pendienteEliminar && <Modal abierto={pendienteEliminar !== null} titulo="Eliminar plan" onCerrar={() => setPendienteEliminar(null)}><p className="text-sm text-slate-600">¿Seguro que deseas eliminar <strong>{pendienteEliminar.nombre}</strong>? Esta acción no se puede deshacer.</p><div className="mt-5 flex gap-3"><Button variante="peligro" onClick={() => { guardarPlanes(planes.filter((item) => item.id !== pendienteEliminar.id)); setPendienteEliminar(null); }}>Eliminar</Button><Button variante="secundario" onClick={() => setPendienteEliminar(null)}>Cancelar</Button></div></Modal>}
      <Card><CardBody><div className="mb-6"><Input id="buscar-plan" etiqueta="Buscar plan" icono={<Search size={18} />} placeholder="Nombre o condición" value={busqueda} onChange={(event) => setBusqueda(event.target.value)} /></div><div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left text-sm"><thead><tr className="border-b border-slate-200 text-slate-500"><th className="px-4 py-3 font-semibold">Plan</th><th className="px-4 py-3 font-semibold">Valor</th><th className="px-4 py-3 font-semibold">Vigencia</th><th className="px-4 py-3 font-semibold">Abono mínimo</th><th className="px-4 py-3 font-semibold">Estado</th><th className="px-4 py-3 text-right font-semibold">Acciones</th></tr></thead><tbody>{visibles.map((plan) => <tr key={plan.id} className="border-b border-slate-100"><td className="px-4 py-4"><p className="font-semibold text-slate-900">{plan.nombre}</p><p className="mt-1 text-slate-500">{plan.condiciones}</p></td><td className="px-4 py-4 font-semibold text-slate-900">{moneda(plan.valor)}</td><td className="px-4 py-4 text-slate-600">{plan.vigencia.cantidad} {plan.vigencia.tipo}</td><td className="px-4 py-4 text-slate-600">{plan.abonoMinimo === null ? "Pago completo" : moneda(plan.abonoMinimo)}</td><td className="px-4 py-4"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${plan.activo ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{plan.activo ? "Activo" : "Inactivo"}</span></td><td className="px-4 py-4"><div className="flex justify-end gap-2"><Button tamano="sm" variante="secundario" onClick={() => abrirEdicion(plan)} aria-label={`Editar ${plan.nombre}`}><Pencil size={16} /></Button><Button tamano="sm" variante="peligro" onClick={() => eliminar(plan)} aria-label={`Eliminar ${plan.nombre}`}><Trash2 size={16} /></Button></div></td></tr>)}</tbody></table>{visibles.length === 0 && <p className="py-10 text-center text-slate-500">No hay planes que coincidan con la búsqueda.</p>}</div></CardBody></Card>
    </div></div>
  );
}
