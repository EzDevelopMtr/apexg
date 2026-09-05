"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { IconName } from "@apexg/core";
import { navSectionsFor } from "@apexg/core";
import {
  Icon,
  SidebarLabel,
  SidebarShell,
  sidebarItemClasses,
} from "@apexg/ui";

export interface ModuleSidebarProps {
  /** Module id, e.g. `clients`. Its sections are looked up here. */
  moduleId: string;
  /** Module name shown at the top, in Spanish. */
  title: string;
  icon: IconName;
  /** Where the module's sections live, e.g. `/modules/clients`. */
  basePath: string;
}

/**
 * Navigation for any module.
 *
 * Sections are resolved here rather than passed in: they carry predicates, and
 * a server layout handing one to this client component would fail at runtime.
 * One component serves every module — the catalogue is data, so a new module
 * needs a route, not a new sidebar.
 */
export default function ModuleSidebar({
  moduleId,
  title,
  icon,
  basePath,
}: ModuleSidebarProps) {
  const currentPath = usePathname();
  const sections = navSectionsFor(moduleId);

  return (
    <SidebarShell
      title={title}
      subtitle="APEX GYM"
      iconName={icon}
      footer={
        <Link
          href="/modules"
          className="flex h-12 w-full items-center rounded-xl px-3 text-slate-400 transition hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft size={21} className="shrink-0" />
          <SidebarLabel>Cambiar módulo</SidebarLabel>
        </Link>
      }
    >
      {sections.map((section) => {
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
