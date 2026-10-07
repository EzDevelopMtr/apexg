"use client";

import { Plus, Search } from "lucide-react";
import type { PlatformCompany } from "@apexg/core";
import { SegmentedControl, materialButton } from "@apexg/ui";
import { useGymFilter } from "../hooks/use-gym-filter";
import GymRow, { LIST_COLUMNS } from "./gym-row";
import GymStats from "./gym-stats";

const FILTERS = [
  { id: "all", label: "Todos" },
  { id: "active", label: "Activos" },
  { id: "suspended", label: "Suspendidos" },
] as const;

export interface GymsViewProps {
  readonly companies: readonly PlatformCompany[];
  readonly loading: boolean;
  readonly error: string | null;
  readonly logoSrc: (company: PlatformCompany) => string | undefined;
  readonly onOpen: (id: string) => void;
  readonly onCreate: () => void;
}

function lede(companies: readonly PlatformCompany[]): string {
  const suspended = companies.filter((c) => c.status === "suspended").length;
  const total = `${companies.length} ${companies.length === 1 ? "gimnasio" : "gimnasios"} en la plataforma`;
  return suspended ? `${total} · ${suspended} ${suspended === 1 ? "suspendido" : "suspendidos"}` : total;
}

/** Every gym on the platform: the numbers first, then the list to act on. */
export default function GymsView({ companies, loading, error, logoSrc, onOpen, onCreate }: GymsViewProps) {
  const filter = useGymFilter(companies);
  return (
    <>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="text-[clamp(2rem,4vw,2.75rem)] font-bold leading-[1.05] tracking-[-0.02em]">Gimnasios</h1>
          <p className="mt-2 text-[15px] text-body-soft">{loading ? "Cargando…" : lede(companies)}</p>
        </div>
        <button type="button" onClick={onCreate} className={materialButton("primary")}>
          <Plus size={18} /> Nuevo gimnasio
        </button>
      </div>

      <GymStats companies={companies} />

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <label className="relative w-full sm:w-auto sm:max-w-[360px] sm:flex-1">
          <Search size={16} aria-hidden className="absolute left-3 top-1/2 -translate-y-1/2 text-body-faint" />
          <input
            type="search"
            value={filter.query}
            onChange={(event) => filter.setQuery(event.target.value)}
            placeholder="Buscar por nombre o dirección"
            aria-label="Buscar gimnasio"
            className="h-[38px] w-full rounded-[11px] border border-transparent bg-fill-2 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-body-faint focus:border-brand focus:bg-fill-1"
          />
        </label>
        <SegmentedControl options={FILTERS} value={filter.status} onChange={filter.setStatus} label="Filtrar por estado" size="sm" />
      </div>

      <div role="list" className="overflow-hidden rounded-2xl bg-panel shadow-tile contrast-more:border contrast-more:border-body-faint">
        <div aria-hidden className={`${LIST_COLUMNS} hidden h-10 text-[11px] font-semibold uppercase tracking-[0.07em] text-body-faint md:grid`}>
          <span />
          <span>Gimnasio</span>
          <span>Estado</span>
          <span className="text-right">Clientes</span>
          <span className="text-right">Usuarios</span>
          <span />
        </div>
        {error && <p role="alert" className="p-10 text-center text-danger-ink">{error}</p>}
        {!error && !loading && filter.visible.length === 0 && (
          <p className="p-10 text-center text-body-soft">Ningún gimnasio coincide con la búsqueda.</p>
        )}
        {filter.visible.map((company, index) => (
          <div role="listitem" key={company.id}>
            <GymRow company={company} logoSrc={logoSrc(company)} onOpen={onOpen} separated={index > 0} />
          </div>
        ))}
      </div>
    </>
  );
}
