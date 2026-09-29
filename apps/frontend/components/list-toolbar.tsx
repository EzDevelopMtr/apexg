"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { listFiltersFor, navSectionsFor, primaryActionFor } from "@apexg/core";
import { FilterBar, buttonClasses, filterChipClasses } from "@apexg/ui";

export interface ListToolbarProps {
  moduleId: string;
  basePath: string;
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
 * Fuera de un listado —en un formulario o un panel— no se muestra.
 */
export default function ListToolbar({ moduleId, basePath }: ListToolbarProps) {
  const currentSection = usePathname().slice(basePath.length + 1);
  const isList = navSectionsFor(moduleId).some(
    (section) => section.id === currentSection && section.kind === "list",
  );
  if (!isList) return null;

  const filters = listFiltersFor(moduleId);
  const action = primaryActionFor(moduleId);
  if (filters.length === 0 && !action) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      {filters.length > 0 ? (
        <FilterBar label="Filtrar el listado">
          {filters.map((filter) => {
            const active = filter.id === currentSection;
            return (
              <Link
                key={filter.id}
                href={`${basePath}/${filter.id}`}
                aria-current={active ? "page" : undefined}
                className={filterChipClasses(active)}
              >
                {filter.label}
              </Link>
            );
          })}
        </FilterBar>
      ) : (
        // Mantiene la acción a la derecha aunque no haya filtros.
        <span />
      )}

      {action && (
        <Link
          href={`${basePath}/${action.id}`}
          className={buttonClasses("primary", "sm")}
        >
          <Plus size={18} />
          {action.label}
        </Link>
      )}
    </div>
  );
}
