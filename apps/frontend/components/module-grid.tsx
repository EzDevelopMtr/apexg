"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, LogOut } from "lucide-react";
import type { Module } from "@apexg/core";
import { MODULES, ROLE_LABELS, canAccessModule } from "@apexg/core";
import { ACCENT_GLOW, ACCENT_TILE, Button, Icon, Logo } from "@apexg/ui";
import type { Session } from "../lib/session-context";
import { useSession } from "../lib/use-session";

const CARD_BASE =
  "group relative overflow-hidden rounded-2xl border border-line bg-panel p-5 text-left transition duration-300";
const CARD_AVAILABLE = "hover:-translate-y-1 hover:shadow-xl";
const CARD_DISABLED = "cursor-not-allowed opacity-50";

/**
 * The page holds every module at once, so its rhythm answers to the height of
 * the screen rather than to fixed steps. Only spacing scales: type stays in
 * rem so browser zoom keeps working and nothing shrinks below legibility.
 */
const PAGE_TOP = "pt-[clamp(1.25rem,3vh,2.5rem)]";
const GRID_TOP = "mt-[clamp(1.75rem,5vh,3rem)]";
const GRID_GAP = "gap-[clamp(0.875rem,1.8vh,1.25rem)]";
const PAGE_BOTTOM = "pb-[clamp(1.5rem,4vh,3rem)]";
const SHELL = "mx-auto w-full max-w-7xl px-6 lg:px-10";

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
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${ACCENT_TILE[module.accent]}`}
        >
          <Icon name={module.icon} size={22} />
        </span>

        <span className="mt-4 flex items-end justify-between gap-4">
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

function SessionBar({
  session,
  onSignOut,
}: {
  session: Session;
  onSignOut: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-brand-ink text-sm font-bold uppercase text-brand-ink">
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
      {/* The pull cancels the button's own padding, so its label ends on the
          same axis as the cards below instead of 1rem inside them. */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onSignOut}
        className="-mr-4"
        aria-label="Cerrar sesión"
      >
        <LogOut size={18} />
        <span className="hidden sm:inline">Cerrar sesión</span>
      </Button>
    </div>
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
    // The dot grid belongs to this screen alone: it is the only one with no
    // table for the pattern to compete with.
    <div className="ground-grid flex min-h-dvh flex-col">
      {/* `my-auto` rather than `justify-center` on the parent: an auto margin
          only ever absorbs POSITIVE free space, so a screen too short for the
          eight cards scrolls normally instead of clipping the greeting off the
          top — which is exactly what centring would do. */}
      <main className={`${SHELL} ${PAGE_TOP} ${PAGE_BOTTOM} my-auto`}>
        {/* One row: the greeting and the session sit on the same baseline and
            end on the same two edges as the cards below. Reversed when it
            stacks, so the account stays above the greeting rather than under
            it. */}
        <header className="flex flex-col-reverse items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
            <Logo size="md" />
            <span aria-hidden className="hidden h-14 w-px bg-line sm:block" />
            <div>
              <h1 className="text-3xl font-bold text-body">
                ¡Hola, {session?.username}!
              </h1>
              <p className="mt-2 text-body-soft">
                Selecciona el módulo al que deseas ingresar.
              </p>
            </div>
          </div>

          {session && (
            <SessionBar session={session} onSignOut={handleSignOut} />
          )}
        </header>

        {/* Four across from xl: eight modules then land in two rows, which is
            what keeps the whole selector on one screen without scrolling. */}
        <div
          className={`${GRID_TOP} ${GRID_GAP} grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`}
        >
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
  );
}
