"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Dumbbell, Eye, EyeOff, LockKeyhole, User } from "lucide-react";
import { Button, Card, CardBody, Input } from "@apexg/ui";
import { useSession } from "../lib/use-session";

export default function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();
  const { signIn, session } = useSession();

  useEffect(() => {
    if (session) router.replace("/modules");
  }, [session, router]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!username.trim()) return setError("Ingresa tu usuario.");
    if (!password.trim()) return setError("Ingresa tu contraseña.");

    if (!signIn(username, password)) {
      return setError("Usuario o contraseña incorrectos.");
    }

    router.replace("/modules");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 shadow-lg">
            <Dumbbell size={32} strokeWidth={2} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">APEX GYM</h1>
          <p className="mt-1 text-slate-500">Sistema de gestión</p>
        </div>

        <Card>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                id="username"
                label="Usuario"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                icon={<User size={18} />}
                autoComplete="username"
                placeholder="Tu usuario"
              />

              <div className="relative">
                <Input
                  id="password"
                  label="Contraseña"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  icon={<LockKeyhole size={18} />}
                  autoComplete="current-password"
                  placeholder="Tu contraseña"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((shown) => !shown)}
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                  className="absolute right-4 top-11 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {error && (
                <p role="alert" className="text-sm text-red-600">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full">
                Iniciar sesión
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </main>
  );
}
