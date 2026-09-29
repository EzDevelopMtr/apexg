"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { findModule, navTabsFor } from "@apexg/core";
import { Icon, TopBarShell, topBarTabClasses } from "@apexg/ui";

export interface ModuleTopBarProps {
  /** Module id, e.g. `clients`. Its name and sections are looked up from it. */
  moduleId: string;
  /** Where the module's sections live, e.g. `/modules/clients`. */
  basePath: string;
}

/**
 * Navegación de cualquier módulo.
 *
 * Solo recibe el id y la ruta base: el nombre y las pestañas salen del
 * catálogo, no se repiten en las ocho llamadas donde dos copias podrían
 * desalinearse.
 */
export default function ModuleTopBar({ moduleId, basePath }: ModuleTopBarProps) {
  const currentPath = usePathname();
  const module = findModule(moduleId);

  // Inalcanzable en la práctica: RequireModule ya rechazó un id desconocido.
  if (!module) return null;

  const currentSection = currentPath.slice(basePath.length + 1);
  const tabs = navTabsFor(moduleId);

  return (
    <TopBarShell
      title={module.name}
      trailing={
        <Link
          href="/modules"
          className="flex h-9 items-center gap-2 rounded-lg px-3 text-sm text-body-faint transition hover:bg-panel/10 hover:text-body"
        >
          <ArrowLeft size={18} className="shrink-0" />
          <span className="hidden md:inline">Cambiar módulo</span>
        </Link>
      }
    >
      {tabs.length > 0
        ? tabs.map((tab) => {
            const active = tab.matches.includes(currentSection);
            return (
              <Link
                key={tab.id}
                href={`${basePath}/${tab.id}`}
                aria-current={active ? "page" : undefined}
                className={topBarTabClasses(active)}
              >
                <Icon name={tab.icon} size={17} className="shrink-0" />
                {tab.label}
              </Link>
            );
          })
        : null}
    </TopBarShell>
  );
}
