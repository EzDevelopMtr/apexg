import { FormEvent, useState } from "react";
import {
  Dumbbell,
  Eye,
  EyeOff,
  LockKeyhole,
  User,
} from "lucide-react";

interface LoginProps {
  onLogin?: (username: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
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
    // =====================================
    // CREDENCIALES TEMPORALES DE ADMIN
    // =====================================

    const ADMIN_USERNAME = "apexg";
    const ADMIN_PASSWORD = "apex2026";

    if (
      username !== ADMIN_USERNAME ||
      password !== ADMIN_PASSWORD)
       {
  setError("Usuario o contraseña incorrectos.");
  return;
}

    // =====================================
    // LOGIN CORRECTO
    // =====================================

  setLoading(true);

  setTimeout(() => {
    setLoading(false);

    console.log("Administrador autenticado");

    // Avisamos a App.tsx que el login fue correcto
    onLogin?.(username);

  }, 700);
};

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8">

      {/* =================================
          CONTENEDOR PRINCIPAL
      ================================= */}

      <div className="w-full max-w-md">

        {/* =================================
            LOGO
        ================================= */}

        <div className="mb-8 text-center">

          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 shadow-lg">

            <Dumbbell
              size={32}
              strokeWidth={2}
              className="text-white"
            />

          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Sistema Gimnasio
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Sistema de gestión
          </p>

        </div>

        {/* =================================
            TARJETA DEL LOGIN
        ================================= */}

        <section className="rounded-2xl bg-white p-7 shadow-xl shadow-slate-200/60">

          <div className="mb-7">

            <h2 className="text-xl font-semibold text-slate-900">
              Iniciar sesión
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Ingresa tus credenciales para continuar
            </p>

          </div>

          {/* =================================
              FORMULARIO
          ================================= */}

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            {/* USUARIO */}

            <div>

              <label
                htmlFor="username"
                className="mb-2 block text-sm font-medium text-slate-700"
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
                  className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                />

              </div>

            </div>

            {/* CONTRASEÑA */}

            <div>

              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-700"
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
                  className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
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
              className="w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >

              {loading
                ? "Ingresando..."
                : "Ingresar"}

            </button>

          </form>

        </section>

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