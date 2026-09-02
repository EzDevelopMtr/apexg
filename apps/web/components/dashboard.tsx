"use client";

import { useEffect, useState } from "react";

import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CreditCard,
  DollarSign,
  Users,
} from "lucide-react";

import {
  CLAVES_ALMACENAMIENTO,
  clientesIniciales,
  compararConMesAnterior,
  diasParaVencer,
  egresosIniciales,
  pagosIniciales,
  type Cliente,
  type Egreso,
  type Pago,
} from "@apexg/core";

import { useSesion } from "../lib/auth";

/*
  =====================================================
  DASHBOARD (RF-35)
  =====================================================

  Indicadores clave calculados a partir de los datos
  reales guardados por los demas modulos en
  localStorage (mientras no exista Backend).
*/

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
    return valorInicial;
  }
}

export default function Dashboard() {
  const { sesion } = useSesion();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [egresos, setEgresos] = useState<Egreso[]>([]);

  useEffect(() => {
    // oxlint-disable react/set-state-in-effect
    setClientes(leerLista(CLAVES_ALMACENAMIENTO.clientes, clientesIniciales));
    setPagos(leerLista(CLAVES_ALMACENAMIENTO.pagos, pagosIniciales));
    setEgresos(leerLista(CLAVES_ALMACENAMIENTO.egresos, egresosIniciales));
    // oxlint-enable react/set-state-in-effect
  }, []);

  const hoy = new Date().toISOString().slice(0, 10);

  const activos = clientes.filter((cliente) => cliente.estado === "Activo").length;
  const enMora = clientes.filter((cliente) => cliente.estado === "En mora").length;
  const porVencer = clientes.filter(
    (cliente) =>
      cliente.estado === "Activo" &&
      diasParaVencer(cliente.fechaVencimiento, hoy) >= 0 &&
      diasParaVencer(cliente.fechaVencimiento, hoy) <= 7
  ).length;

  const comparacion = compararConMesAnterior(pagos, egresos, clientes, hoy.slice(0, 7));

  const totalMembresias = clientes.length;
  const porcentaje = (valor: number) =>
    totalMembresias === 0 ? 0 : Math.round((valor / totalMembresias) * 100);

  const statistics = [
    {
      title: "Clientes activos",
      value: String(activos),
      description: `${totalMembresias} clientes registrados en total`,
      icon: Users,
    },
    {
      title: "Clientes en mora",
      value: String(enMora),
      description: "Requieren seguimiento de pago",
      icon: AlertTriangle,
    },
    {
      title: "Por vencer",
      value: String(porVencer),
      description: "Próximos 7 días",
      icon: CreditCard,
    },
    {
      title: "Ingresos del mes",
      value: moneda(comparacion.actual.ingresos),
      description: `${comparacion.variacionPorcentaje >= 0 ? "+" : ""}${comparacion.variacionPorcentaje}% vs. mes anterior`,
      icon: DollarSign,
    },
  ];

  const pagosRecientes = [...pagos]
    .sort((a, b) => (a.fecha < b.fecha ? 1 : -1))
    .slice(0, 3);

  return (
    <main className="min-h-screen bg-slate-100 pl-20">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm text-slate-500">Panel de indicadores</p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              Buenos días{sesion ? `, ${sesion.usuario}` : ""} 👋
            </h1>

            <p className="mt-2 text-sm text-slate-500">Aquí tienes un resumen del gimnasio.</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
            {new Date(hoy).toLocaleDateString("es-CO", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </div>
        </div>

        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {statistics.map((stat) => {
            const Icon = stat.icon;

            return (
              <article
                key={stat.title}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{stat.value}</p>
                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                    <Icon size={21} />
                  </div>
                </div>

                <p className="mt-4 text-xs text-slate-500">{stat.description}</p>
              </article>
            );
          })}
        </section>

        <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Resumen de clientes</h2>
                <p className="mt-1 text-sm text-slate-500">Estado actual de la base de clientes.</p>
              </div>

              <CreditCard size={22} className="text-slate-400" />
            </div>

            <div className="mt-7 space-y-5">
              <BarraResumen etiqueta="Activos" valor={activos} porcentaje={porcentaje(activos)} color="bg-slate-900" />
              <BarraResumen etiqueta="Por vencer" valor={porVencer} porcentaje={porcentaje(porVencer)} color="bg-amber-400" />
              <BarraResumen etiqueta="En mora" valor={enMora} porcentaje={porcentaje(enMora)} color="bg-red-400" />
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Pagos recientes</h2>
            <p className="mt-1 text-sm text-slate-500">Últimos movimientos registrados.</p>

            <div className="mt-6 space-y-5">
              {pagosRecientes.map((pago) => (
                <div key={pago.id} className="flex gap-3">
                  <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                  <div>
                    <p className="text-sm font-medium">{pago.clienteNombre}</p>
                    <p className="text-xs text-slate-500">
                      {pago.tipoAbono} · {moneda(pago.valorPagado)}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">{pago.fecha}</p>
                  </div>
                </div>
              ))}

              {pagosRecientes.length === 0 && (
                <p className="text-sm text-slate-500">Aún no hay pagos registrados.</p>
              )}
            </div>
          </article>
        </section>

        <section className="mt-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Acciones rápidas</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <a
              href="/modulos/clientes/agregar"
              className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-4 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Users size={18} />
              Nuevo cliente
            </a>

            <a
              href="/modulos/membresias/todos"
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <CreditCard size={18} />
              Ver membresías
            </a>

            <a
              href="/modulos/pagos/registrar"
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <ArrowUp size={18} />
              Registrar pago
            </a>

            <a
              href="/modulos/finanzas/apartado-diario"
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <ArrowDown size={18} />
              Apartado diario
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}

function BarraResumen({
  etiqueta,
  valor,
  porcentaje,
  color,
}: {
  etiqueta: string;
  valor: number;
  porcentaje: number;
  color: string;
}) {
  return (
    <div>
      <div className="mb-2 flex justify-between text-sm">
        <span className="text-slate-600">{etiqueta}</span>
        <span className="font-semibold">{valor}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max(porcentaje, 2)}%` }} />
      </div>
    </div>
  );
}
