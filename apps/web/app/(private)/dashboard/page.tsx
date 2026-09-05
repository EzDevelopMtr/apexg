import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Dashboard | APEX GYM",
};

/**
 * Placeholder.
 *
 * This route previously rendered ~766 lines of invented figures — client
 * counts and revenue that came from nowhere. Shipping fabricated numbers on a
 * financial screen is worse than shipping nothing, so the mock was removed.
 *
 * The real dashboard is RF-35, built once finances exist. The removed markup
 * is in git history if any of the layout is worth reusing.
 */
export default function DashboardPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-6">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-2 text-slate-500">
          Los indicadores del negocio se construirán cuando el módulo de
          Finanzas exista. Aún no hay datos reales que mostrar.
        </p>
        <Link
          href="/modules"
          className="mt-6 inline-block font-semibold text-blue-600 hover:underline"
        >
          Volver a módulos
        </Link>
      </div>
    </main>
  );
}
