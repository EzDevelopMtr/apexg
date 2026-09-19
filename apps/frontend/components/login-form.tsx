"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, User } from "lucide-react";
import { Button, Input, Logo } from "@apexg/ui";
import { useSession } from "../lib/use-session";
import PasswordField from "./password-field";

/**
 * The brand half: shown from `lg` up, where there is room for it to breathe.
 *
 * The photo is a CSS background rather than an `<img>` on purpose: if
 * `/login-hero.jpg` is not there, nothing breaks — the gradient beneath it is
 * the design, and the photo only deepens it.
 */
function BrandPanel() {
  return (
    <section className="relative hidden w-1/2 overflow-hidden bg-shell lg:block">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/login-hero.jpg')" }}
      />
      <div className="ground-grain absolute inset-0 opacity-30" />
      {/* Keeps the logo and the tagline legible without flattening the photo:
          lighter across the middle, heavier at the corners the text sits in. */}
      <div className="absolute inset-0 bg-gradient-to-br from-shell/80 via-shell/50 to-shell/90" />
      <div className="absolute -left-32 top-1/4 h-[28rem] w-[28rem] rounded-full bg-brand/10 blur-3xl" />

      <div className="relative flex h-full flex-col justify-center px-16 text-center">
        <Logo size="lg" className="mb-10" />
        <h2 className="text-4xl font-extrabold leading-tight tracking-tight text-body">
          TU MEJOR VERSIÓN
          <span className="mt-1 block text-brand-ink">EMPIEZA AQUÍ</span>
        </h2>
        <p className="mt-4 text-body-soft">
          Entrena, avanza, supera tus límites.
        </p>
      </div>

      <p className="absolute bottom-10 left-10 text-left text-sm font-bold uppercase leading-snug tracking-wider text-body-faint">
        Disciplina hoy,
        <br />
        resultados <span className="text-brand-ink">mañana</span>
      </p>
    </section>
  );
}

export default function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const router = useRouter();
  const { signIn, session } = useSession();

  useEffect(() => {
    if (session) router.replace("/modules");
  }, [session, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!username.trim()) return setError("Ingresa tu usuario.");
    if (!password.trim()) return setError("Ingresa tu contraseña.");

    setSubmitting(true);
    const result = await signIn(username, password);
    setSubmitting(false);

    if (!result.ok) {
      return setError(result.message);
    }

    router.replace("/modules");
  };

  return (
    <main className="flex min-h-screen bg-canvas">
      <BrandPanel />

      <section className="flex w-full flex-1 items-center justify-center px-4 py-10 lg:w-1/2">
        <div className="w-full max-w-md rounded-2xl border border-line bg-panel p-8 shadow-2xl sm:p-10">
          <Logo size="md" className="mb-8" />

          <h1 className="text-2xl font-bold text-body">Inicia sesión</h1>
          <p className="mt-1 text-body-soft">
            Accede a tu cuenta y sigue con tu entrenamiento.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <Input
              id="username"
              aria-label="Usuario"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              icon={<User size={18} />}
              autoComplete="username"
              placeholder="Usuario"
            />

            <PasswordField value={password} onChange={setPassword} />

            {error && (
              <p role="alert" className="text-sm text-danger-ink">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Ingresando…" : "Ingresar"}
              {!submitting && <ArrowRight size={18} />}
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}
