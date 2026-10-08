"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Module, ModulePulse } from "@apexg/core";
import { ACCENT_GLOW, ACCENT_TILE, Icon } from "@apexg/ui";
import PulseFigures from "./pulse-figures";

export interface DailyModuleCardProps {
  module: Module;
  pulse: ModulePulse | null;
  /** The module's address and its shortcut's, already inside the gym. */
  href: string;
  shortcutHref?: string;
}

/**
 * A module used on every shift: large, with live figures, and one shortcut to
 * what is done most in it. The whole card is the way in — no arrow button —
 * through a link stretched under the content; the shortcut sits above it.
 */
export default function DailyModuleCard({ module, pulse, href, shortcutHref }: DailyModuleCardProps) {
  return (
    <div className={`group relative flex flex-col overflow-hidden rounded-3xl border border-line bg-panel p-6 transition duration-300 hover:-translate-y-1 hover:shadow-xl ${module.featured ? "min-h-64" : "min-h-56"}`}>
      {/* A faint wash at rest says "this one is for every day"; hover lifts it. */}
      <span aria-hidden className={`absolute inset-0 bg-gradient-to-br to-transparent opacity-50 transition-opacity duration-300 group-hover:opacity-100 ${ACCENT_GLOW[module.accent]}`} />
      <Link href={href} aria-label={module.name} className="absolute inset-0 z-10 rounded-3xl" />

      <div className="pointer-events-none relative flex items-start justify-between gap-3">
        <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${ACCENT_TILE[module.accent]}`}>
          <Icon name={module.icon} size={22} />
        </span>
        {module.shortcut && shortcutHref && (
          <Link
            href={shortcutHref}
            className="pointer-events-auto relative z-20 inline-flex items-center gap-1.5 rounded-xl bg-surface px-3 py-2 text-sm font-semibold text-body transition hover:bg-brand hover:text-brand-contrast active:scale-95"
          >
            {module.shortcut.label}
            <ArrowRight size={15} />
          </Link>
        )}
      </div>

      <div className="pointer-events-none relative mt-4">
        <h3 className={`font-bold text-body ${module.featured ? "text-2xl" : "text-xl"}`}>
          {module.name}
          {module.featured && (
            <span className="ml-2 inline-block rounded-full bg-brand-soft px-2 py-0.5 align-middle text-xs font-semibold text-brand-ink">
              Lo más usado
            </span>
          )}
        </h3>
        <p className="mt-1 text-sm text-body-soft">{module.description}</p>
      </div>

      <div className="pointer-events-none relative mt-auto pt-5">
        <PulseFigures moduleId={module.id} pulse={pulse} />
      </div>
    </div>
  );
}
