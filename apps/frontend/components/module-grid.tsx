"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, LogOut } from "lucide-react";
import type { Module } from "@apexg/core";
import { MODULES, ROLE_LABELS, canAccessModule } from "@apexg/core";
import { ACCENT_GLOW, ACCENT_TILE, Button, Icon, Logo } from "@apexg/ui";
import { useSession } from "../lib/use-session";
import SelectorSidebar from "./selector-sidebar";

const CARD_BASE =
  "group relative overflow-hidden rounded-2xl border border-line bg-panel p-6 text-left transition duration-300";
const CARD_AVAILABLE = "hover:-translate-y-1 hover:shadow-xl";
const CARD_DISABLED = "cursor-not-allowed opacity-50";

function ModuleCard({ module }: { module: Module }) {
  return (
    <>
      {/* The accent only washes in on hover, so eight cards at rest stay calm. */}
      <span
        aria-hidden
        className={`absolute inset-0 bg-gradient-to-br to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${ACCENT_GLOW[module.accent]}`}
      />

      <span className="relative block">
        <span
          className={`flex h-14 w-14 items-center justify-center rounded-2xl ${ACCENT_TILE[module.accent]}`}
        >
          <Icon name={module.icon} size={26} />
        </span>

        <span className="mt-6 flex items-end justify-between gap-4">
          <span className="block">
            <span className="block text-lg font-bold text-body">
              {module.name}
            </span>
            <span className="mt-1 block text-sm text-body-soft">
              {module.description}
            </span>
            {!module.available && (
              <span className="mt-3 block text-xs font-semibold uppercase tracking-wider text-body-faint">
                Próximamente
              </span>
            )}
          </span>

          {module.available && (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-body-soft transition group-hover:border-brand group-hover:bg-brand group-hover:text-brand-contrast">
              <ArrowRight size={18} />
            </span>
          )}
        </span>
      </span>
    </>
  );
}

export default function ModuleGrid() {
  const router = useRouter();
  const { session, signOut } = useSession();

  // RF-02: the matrix decides what this role even sees. Hiding a card is not
  // security — RequireModule guards the route, and the API must too (RNF-03).
  const visibleModules = session
    ? MODULES.filter((module) => canAccessModule(session.role, module.id))
    : [];

  const handleSignOut = async () => {
    // Awaited: signOut() clears the httpOnly cookie server-side, and
    // navigating before that finishes could race proxy.ts into seeing the
    // still-valid cookie and bouncing straight back here.
    await signOut();
    router.replace("/login");
  };

  return (
    <div className="flex min-h-screen bg-canvas">
      <SelectorSidebar onSignOut={handleSignOut} />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Below lg the rail is gone, so the logo and the way out come here. */}
        <header className="flex items-center justify-between gap-4 border-b border-line px-6 py-4 lg:justify-end lg:border-0 lg:px-10 lg:py-6">
          <Logo size="sm" markOnly className="lg:hidden" />

          {session && (
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-brand text-sm font-bold uppercase text-brand">
                {session.username.slice(0, 2)}
              </span>
              <span className="hidden text-left sm:block">
                <span className="block text-sm font-semibold text-body">
                  {session.username}
                </span>
                <span className="block text-xs text-body-soft">
                  {ROLE_LABELS[session.role]}
                </span>
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="lg:hidden"
                aria-label="Cerrar sesión"
              >
                <LogOut size={18} />
              </Button>
            </div>
          )}
        </header>

        <main className="flex-1 px-6 pb-12 pt-8 lg:px-10 lg:pt-2">
          <span className="block h-1 w-10 rounded-full bg-brand" />
          <h1 className="mt-5 text-3xl font-bold text-body">
            ¡Hola, {session?.username}!
          </h1>
          <p className="mt-2 text-body-soft">
            Selecciona el módulo al que deseas ingresar.
          </p>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {visibleModules.map((module) =>
              module.available && module.route ? (
                <Link
                  key={module.id}
                  href={module.route}
                  className={`${CARD_BASE} ${CARD_AVAILABLE}`}
                >
                  <ModuleCard module={module} />
                </Link>
              ) : (
                <div
                  key={module.id}
                  aria-disabled="true"
                  className={`${CARD_BASE} ${CARD_DISABLED}`}
                >
                  <ModuleCard module={module} />
                </div>
              ),
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
