import type { PlatformCompany } from "@apexg/core";

/** The platform at a glance: four numbers that answer "how are we doing?". */
export default function GymStats({ companies }: { readonly companies: readonly PlatformCompany[] }) {
  const active = companies.filter((c) => c.status === "active").length;
  const tiles: readonly [string, string, string][] = [
    ["Activos", String(active), "gimnasios operando"],
    ["Suspendidos", String(companies.length - active), "sin acceso"],
    ["Clientes activos", companies.reduce((s, c) => s + c.activeClients, 0).toLocaleString("es-CO"), "en todos los gimnasios"],
    ["Usuarios", String(companies.reduce((s, c) => s + c.users, 0)), "administradores y recepción"],
  ];
  return (
    <div className="mb-7 grid grid-cols-2 gap-3 md:grid-cols-4">
      {tiles.map(([label, value, hint]) => (
        <div key={label} className="rounded-2xl bg-panel px-[18px] py-4 shadow-tile contrast-more:border contrast-more:border-body-faint">
          <div className="text-[11px] font-semibold uppercase tracking-[0.07em] text-body-faint">{label}</div>
          <div className="mt-1.5 text-[28px] font-semibold leading-tight tracking-[-0.015em] tabular-nums">{value}</div>
          <div className="text-xs text-body-soft">{hint}</div>
        </div>
      ))}
    </div>
  );
}
