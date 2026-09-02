"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { modulos, puedeAccederModulo } from "@apexg/core";
import { obtenerIcono } from "@apexg/ui";
import { useSesion } from "../lib/auth";

const IconoDashboard = obtenerIcono("grafico");


export default function ModuleGrid() {

  const router = useRouter();

  const { cerrarSesion, sesion } = useSesion();

  // RF-02 / RNF-03: solo se muestran los modulos permitidos para el rol.
  const modulosVisibles = sesion
    ? modulos.filter((modulo) => puedeAccederModulo(sesion.rol, modulo.id))
    : [];


  /*
    -----------------------------------------------------
    CERRAR SESION
    -----------------------------------------------------
  */

  const handleLogout = () => {

    cerrarSesion();

    router.replace("/login");
  };


  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
              APEX GYM
            </p>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              Selecciona un módulo
            </h1>

            {sesion && (
              <p className="mt-2 text-sm text-slate-500">
                Sesión: <strong className="text-slate-700">{sesion.usuario}</strong> ·{" "}
                {sesion.rol === "administrador" ? "Administrador" : "Recepcionista"}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            {sesion?.rol === "administrador" && (
              <Link
                href="/dashboard"
                className="group inline-flex items-center justify-center gap-2 rounded-full border-2 border-blue-500 px-4 py-2 text-xs font-bold tracking-wide text-blue-600 transition-all duration-300 hover:-translate-y-0.5 hover:border-orange-500 hover:text-orange-600 hover:shadow-md"
              >
                <IconoDashboard
                  size={16}
                  className="transition-transform duration-300 group-hover:scale-110"
                />
                Ver dashboard
              </Link>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-blue-700 transition hover:border-blue-400 hover:bg-blue-100 hover:text-blue-800"
            >
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-blue-500" />
              Cerrar sesión
            </button>
          </div>
        </div>

        <div className="mb-10 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur-sm">
          <p className="text-slate-600">
            Selecciona el área que deseas administrar.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {modulosVisibles.map((modulo) => {
            const Icono = obtenerIcono(modulo.icono);
            const isAvailable = modulo.disponible && modulo.ruta;

            const tarjeta = (
              <>
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-orange-50 text-blue-600 shadow-sm ring-1 ring-slate-200 transition-all duration-300 group-hover:from-blue-600 group-hover:to-orange-500 group-hover:text-white group-hover:ring-blue-200">
                  <Icono size={28} />
                </div>

                <h2 className="text-lg font-bold text-slate-900">
                  {modulo.nombre}
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {modulo.descripcion}
                </p>

                {!isAvailable && (
                  <span className="mt-4 inline-block text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Próximamente
                  </span>
                )}
              </>
            );

            if (!isAvailable) {
              return (
                <button
                  key={modulo.id}
                  type="button"
                  disabled
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm opacity-60"
                >
                  <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-slate-300 via-slate-200 to-slate-300" />
                  {tarjeta}
                </button>
              );
            }

            return (
              <Link
                key={modulo.id}
                href={modulo.ruta!}
                className="group relative block overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg"
              >
                <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-blue-400 to-orange-400" />
                {tarjeta}
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
