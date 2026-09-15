"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Dumbbell, User } from "lucide-react";
import { Button, Card, CardBody, Input } from "@apexg/ui";
import { useSession } from "../lib/use-session";
import PasswordField from "./password-field";

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
    <main className="ground-grain flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-shell shadow-lg">
            <Dumbbell size={32} strokeWidth={2} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-body">APEX GYM</h1>
          <p className="mt-1 text-body-soft">Sistema de gestión</p>
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

              <PasswordField value={password} onChange={setPassword} />

              {error && (
                <p role="alert" className="text-sm text-danger-ink">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Iniciando sesión…" : "Iniciar sesión"}
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </main>
  );
}
