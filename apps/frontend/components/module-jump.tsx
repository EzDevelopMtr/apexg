"use client";

import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import { MODULES, canAccessModule, isModuleEnabled, modulesByTier } from "@apexg/core";
import { useGymSettings } from "@apexg/module-kit";
import { ACCENT_TILE, Icon } from "@apexg/ui";
import { useGymPath } from "../lib/gym-path";
import { useSession } from "../lib/use-session";

const ITEM = "flex h-9 items-center gap-2 rounded-lg px-2 text-sm font-medium transition";

/**
 * Replaces "← Cambiar módulo": the daily modules are one click from each other
 * instead of two through the selector, which stays a click away as "Todos".
 */
export default function ModuleJump({ current }: { current: string }) {
  const to = useGymPath();
  const { session } = useSession();
  const settings = useGymSettings();
  const daily = session
    ? modulesByTier(MODULES).daily.filter((m) => canAccessModule(session.role, m.id) && isModuleEnabled(settings, m.id))
    : [];

  return (
    <nav aria-label="Cambiar de módulo" className="flex items-center gap-1 rounded-xl border border-line bg-panel/5 p-1">
      {daily.map((module) => {
        const here = module.id === current;
        return (
          <Link
            key={module.id}
            href={to(module.route ?? "/modules")}
            aria-current={here ? "page" : undefined}
            title={module.name}
            className={`${ITEM} ${here ? "bg-panel/15 text-body" : "text-body-faint hover:bg-panel/10 hover:text-body"}`}
          >
            <span className={`flex h-6 w-6 items-center justify-center rounded-md ${ACCENT_TILE[module.accent]}`}>
              <Icon name={module.icon} size={13} />
            </span>
            <span className="hidden lg:inline">{module.name}</span>
          </Link>
        );
      })}
      {daily.length > 0 && <span aria-hidden className="mx-0.5 h-5 w-px bg-line" />}
      <Link href={to("/modules")} title="Todos los módulos" className={`${ITEM} text-body-faint hover:bg-panel/10 hover:text-body`}>
        <LayoutGrid size={17} />
        <span className="hidden md:inline">Todos</span>
      </Link>
    </nav>
  );
}
