"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LayoutGrid } from "lucide-react";
import { materialButton } from "@apexg/ui";

const FIELD =
  "h-[42px] w-full rounded-[11px] border border-transparent bg-fill-2 text-[15px] outline-none transition-[border-color,box-shadow] focus:border-brand focus:ring-[3px] focus:ring-brand-soft";

/**
 * The platform's own sign-in: no gym's name, logo or colour, because the
 * panel belongs to none of them. Same material as the panel it leads to.
 */
export default function PlatformLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    const response = await fetch("/api/platform-session/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setSubmitting(false);
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { message?: string } | null;
      return setError(body?.message ?? "No se pudo iniciar sesión.");
    }
    router.replace("/admin");
    router.refresh();
  };

  return (
    <main className="ground-grain flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-[400px] animate-materialize rounded-[22px] bg-panel/85 p-8 shadow-sheet backdrop-blur-[40px] motion-reduce:animate-none transparency-reduce:bg-panel"
      >
        <span aria-hidden className="mb-5 grid size-12 place-items-center rounded-[14px] bg-brand-soft text-brand-ink shadow-tile">
          <LayoutGrid size={24} />
        </span>
        <h1 className="text-[28px] font-bold leading-tight tracking-[-0.02em]">Panel de plataforma</h1>
        <p className="mb-6 mt-1.5 text-[15px] text-body-soft">Administración de los gimnasios.</p>

        <label htmlFor="platform-email" className="mb-1.5 block text-[13px] text-body-soft">
          Correo
        </label>
        <input
          id="platform-email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`mb-4 ${FIELD} px-3`}
        />
        <label htmlFor="platform-password" className="mb-1.5 block text-[13px] text-body-soft">
          Contraseña
        </label>
        <div className="relative">
          <input
            id="platform-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`${FIELD} pl-3 pr-11`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((on) => !on)}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-body-faint transition-colors hover:text-body"
          >
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
        {error && (
          <p role="alert" className="mt-3 text-sm text-danger-ink">
            {error}
          </p>
        )}
        <button type="submit" disabled={submitting} className={`${materialButton("primary")} mt-5 w-full`}>
          {submitting ? "Ingresando…" : "Ingresar"}
        </button>
      </form>
    </main>
  );
}
