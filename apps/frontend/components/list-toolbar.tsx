"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { listFiltersFor, navSectionsFor, panelActionsFor, primaryActionFor, sectionBehindId } from "@apexg/core";
import { FilterBar, Icon, buttonClasses, filterChipClasses } from "@apexg/ui";
import { useGymPath } from "../lib/gym-path";

export interface ListToolbarProps {
  moduleId: string;
  /** Inside the gym, e.g. `/modules/clients`. */
  basePath: string;
  /** The list's search, on the same row as the filters. */
  search?: ReactNode;
  /** How many records each filter holds, shown beside its label. */
  counts?: Partial<Record<string, number>>;
}

/**
 * La fila sobre la tabla: sus filtros a la izquierda y la acción principal a
 * la derecha.
 *
 * Reúne lo que antes estaba repartido en tres sitios —las secciones del
 * menú, la pestaña "Agregar…" y un botón grande en el encabezado que hacía
 * lo mismo que esa pestaña—. Cada filtro sigue siendo su propia URL
 * (/modules/clients/overdue): un enlace guardado abre la tabla ya filtrada.
 *
 * Fuera de un listado —en un panel— no se muestra. Con un formulario abierto
 * encima sigue la del listado de atrás: el formulario es un diálogo, no un
 * lugar. Las tareas marcadas `tab: false` (Categorías) van como botones al
 * lado de la acción principal.
 */
export default function ListToolbar({ moduleId, basePath, search, counts }: ListToolbarProps) {
  const base = useGymPath()(basePath);
  const currentSection = sectionBehindId(moduleId, usePathname().slice(base.length + 1));
  const isList = navSectionsFor(moduleId).some(
    (section) => section.id === currentSection && section.kind === "list",
  );
  if (!isList) return null;

  const filters = listFiltersFor(moduleId);
  const action = primaryActionFor(moduleId);
  const extras = panelActionsFor(moduleId);
  if (filters.length === 0 && !action && !search && extras.length === 0) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      {filters.length > 0 && (
        <FilterBar label="Filtrar el listado">
          {filters.map((filter) => {
            const active = filter.id === currentSection;
            return (
              <Link
                key={filter.id}
                href={`${base}/${filter.id}`}
                aria-current={active ? "page" : undefined}
                className={filterChipClasses(active)}
              >
                {filter.label}
                {counts?.[filter.id] !== undefined && (
                  <span className="ml-1.5 text-xs tabular-nums opacity-70">{counts[filter.id]}</span>
                )}
              </Link>
            );
          })}
        </FilterBar>
      )}
      {search}

      <div className="ml-auto flex flex-wrap items-center gap-2">
        {extras.map((extra) => (
          <Link key={extra.id} href={`${base}/${extra.id}`} className={buttonClasses("secondary", "sm")}>
            <Icon name={extra.icon} size={17} />
            {extra.label}
          </Link>
        ))}
        {action && (
          <Link href={`${base}/${action.id}`} className={buttonClasses("primary", "sm")}>
            <Plus size={18} />
            {action.label}
          </Link>
        )}
      </div>
    </div>
  );
}
