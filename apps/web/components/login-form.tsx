"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import { useRouter } from "next/navigation";

import {
  Dumbbell,
  Eye,
  EyeOff,
  LockKeyhole,
  User,
} from "lucide-react";

import { useSesion } from "../lib/auth";

/*
  =====================================================
  FORMULARIO DE INICIO DE SESION
  =====================================================

  Es el mismo formulario de antes, con dos cambios
  propios de Next.js:

    1. Las credenciales ya no estan escritas aqui.
       Las valida iniciarSesion() en lib/auth.tsx,
       que sera el unico archivo a cambiar cuando
       exista el Backend.

    2. Al entrar ya no avisamos a App.tsx mediante
       una propiedad onLogin: navegamos a la ruta
       /modulos.
*/

export default function LoginForm() {
  // =====================================
  // ESTADOS DEL FORMULARIO
  // =====================================

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Controla si mostramos la contraseña
  const [showPassword, setShowPassword] = useState(false);

  // Mensaje de error
  const [error, setError] = useState("");

  // Estado del botón
  const [loading, setLoading] = useState(false);

  // Para movernos entre rutas
  const router = useRouter();

  // Validacion de credenciales y guardado de sesion
  const { iniciarSesion, sesion } = useSesion();

  /*
    Si ya hay sesion abierta no tiene sentido
    mostrar el formulario: seguimos al selector.
  */

  useEffect(() => {
    if (sesion) {
      router.replace("/modulos");
    }
  }, [sesion, router]);

  // =====================================
  // ENVÍO DEL FORMULARIO
  // =====================================

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");

    // Validar usuario
    if (!username.trim()) {
      setError("Ingresa tu usuario.");
      return;
    }

    // Validar contraseña
    if (!password.trim()) {
      setError("Ingresa tu contraseña.");
      return;
    }

    setLoading(true);

    /*
      Mantenemos la pequeña espera para que el boton
      alcance a mostrar su estado de carga.
    */

    setTimeout(() => {
      const correcto = iniciarSesion(username, password);

      if (!correcto) {
        setLoading(false);
        setError("Usuario o contraseña incorrectos.");
        return;
      }

      // =====================================
      // LOGIN CORRECTO
      // =====================================

      router.replace("/modulos");
    }, 700);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#eef1f3] px-4 py-6">

      <div className="w-full max-w-[520px]">

        <div className="mb-6 text-center">

          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1d2a39] shadow-[0_8px_24px_rgba(15,23,42,0.15)]">

            <Dumbbell
              size={32}
              strokeWidth={2}
              className="text-white"
            />

          </div>

          <h1 className="text-[2.15rem] font-bold tracking-tight text-[#1f2937]">
            Sistema Gimnasio
          </h1>

          <p className="mt-1 text-base text-slate-500">
            Sistema de gestión
          </p>

        </div>

        <section className="rounded-[1.5rem] bg-[#f5f5f5] p-6 shadow-[0_8px_24px_rgba(148,163,184,0.18)] ring-1 ring-slate-200/80">

          <div className="mb-6">

            <h2 className="text-[2rem] font-semibold leading-tight text-[#1f2937]">
              Iniciar sesión
            </h2>

            <p className="mt-1 text-base text-slate-500">
              Ingresa tus credenciales para continuar
            </p>

          </div>

          {/* =================================
              FORMULARIO
          ================================= */}

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >

            {/* USUARIO */}

            <div>

              <label
                htmlFor="username"
                className="mb-2 block text-base font-medium text-[#1f2937]"
              >
                Usuario
              </label>

              <div className="relative">

                <User
                  size={19}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(event) => {
                    setUsername(event.target.value);
                    setError("");
                  }}
                  placeholder="Ingresa tu usuario"
                  autoComplete="username"
                  className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                />

              </div>

            </div>

            {/* CONTRASEÑA */}

            <div>

              <label
                htmlFor="password"
                className="mb-2 block text-base font-medium text-[#1f2937]"
              >
                Contraseña
              </label>

              <div className="relative">

                <LockKeyhole
                  size={19}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setError("");
                  }}
                  placeholder="Ingresa tu contraseña"
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-11 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                />

                {/* Mostrar / ocultar contraseña */}

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={
                    showPassword
                      ? "Ocultar contraseña"
                      : "Mostrar contraseña"
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                >

                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}

                </button>

              </div>

            </div>

            {/* MENSAJE DE ERROR */}

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            {/* BOTÓN */}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#1d2a39] py-3 text-base font-semibold text-white shadow-sm transition hover:bg-[#162332] focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >

              {loading
                ? "Ingresando..."
                : "Ingresar"}

            </button>

          </form>

        </section>

        {/* =================================
            CREDENCIALES DE PRUEBA
        ================================= */}

        <div className="mt-4 rounded-xl border border-slate-200 bg-white/70 p-4 text-xs text-slate-500">
          <p className="font-semibold text-slate-600">Usuarios de prueba</p>
          <p className="mt-1">Administrador: apexg / apex2026</p>
          <p>Recepcionista: recepcion / apex2026</p>
        </div>

        {/* =================================
            FOOTER
        ================================= */}

        <p className="mt-6 text-center text-xs text-slate-400">
          Sistema de Gestión para Gimnasio
        </p>

      </div>

    </main>
  );
}