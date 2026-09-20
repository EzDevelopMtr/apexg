"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { findModule, navSectionsFor } from "@apexg/core";
import {
  Icon,
  SidebarLabel,
  SidebarShell,
  sidebarItemClasses,
} from "@apexg/ui";

export interface ModuleSidebarProps {
  /** Module id, e.g. `clients`. Its name and sections are looked up from it. */
  moduleId: string;
  /** Where the module's sections live, e.g. `/modules/clients`. */
  basePath: string;
}

/**
 * Navigation for any module.
 *
 * Only the id and the base path are passed in — the name comes from the
 * catalogue rather than being repeated at each of the eight call sites, where
 * two copies could drift apart.
 *
 * Sections are resolved here rather than passed in: they carry predicates, and
 * a server layout handing one to this client component would fail at runtime.
 */
export default function ModuleSidebar({
  moduleId,
  basePath,
}: ModuleSidebarProps) {
  const currentPath = usePathname();
  const module = findModule(moduleId);

  // Unreachable in practice: RequireModule has already rejected an unknown id.
  if (!module) return null;

  return (
    <SidebarShell
      title={module.name}
      footer={
        <Link
          href="/modules"
          className="flex h-12 w-full items-center rounded-xl px-3 text-body-faint transition hover:bg-panel/10 hover:text-body"
        >
          <ArrowLeft size={21} className="shrink-0" />
          <SidebarLabel>Cambiar módulo</SidebarLabel>
        </Link>
      }
    >
      {navSectionsFor(moduleId).map((section) => {
        const path = `${basePath}/${section.id}`;
        const active = currentPath === path;

        return (
          <Link
            key={section.id}
            href={path}
            aria-current={active ? "page" : undefined}
            className={sidebarItemClasses(active)}
          >
            <Icon name={section.icon} size={21} className="shrink-0" />
            <SidebarLabel>{section.label}</SidebarLabel>
          </Link>
        );
      })}
    </SidebarShell>
  );
}
