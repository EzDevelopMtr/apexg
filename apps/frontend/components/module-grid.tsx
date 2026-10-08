"use client";

import { useRouter } from "next/navigation";
import { MODULES, canAccessModule, isModuleEnabled, modulesByTier } from "@apexg/core";
import { useGymSettings, useModulePulse } from "@apexg/module-kit";
import { Logo } from "@apexg/ui";
import { useGymPath } from "../lib/gym-path";
import { useSession } from "../lib/use-session";
import ClientQuickSearch from "./client-quick-search";
import DailyModuleCard from "./daily-module-card";
import ManagementModuleCard from "./management-module-card";
import SessionBar from "./session-bar";

/**
 * The page answers to the height of the screen: only spacing scales, type
 * stays in rem so browser zoom keeps working.
 */
const SHELL = "mx-auto w-full max-w-7xl px-6 lg:px-10";
const PAGE_Y = "pt-[clamp(1.25rem,3vh,2.5rem)] pb-[clamp(1.5rem,4vh,3rem)]";
const TIER_TITLE = "text-xs font-semibold uppercase tracking-wider text-body-faint";

function TierHeading({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="mb-4 flex items-baseline gap-3">
      <h2 className={TIER_TITLE}>{title}</h2>
      <span className="text-sm text-body-faint">{hint}</span>
    </div>
  );
}

/**
 * The module selector, in two tiers by how often each module is used: the
 * daily ones large and first — with live figures and their shortcut — and the
 * management ones compact below. Which tier a module is in is data
 * (`MODULES[].tier`), not a condition here.
 */
export default function ModuleGrid() {
  const router = useRouter();
  const to = useGymPath();
  const { session, signOut } = useSession();
  const settings = useGymSettings();
  const { pulse, clients } = useModulePulse();

  // RF-02: the matrix decides what this role even sees. Hiding a card is not
  // security — RequireModule guards the route, and the API must too (RNF-03).
  const visible = session
    ? MODULES.filter((module) => canAccessModule(session.role, module.id) && isModuleEnabled(settings, module.id))
    : [];
  const { daily, management } = modulesByTier(visible);
  const hrefOf = (route: string | null) => (route ? to(route) : null);

  const handleSignOut = async () => {
    // Awaited: signOut() clears the httpOnly cookie server-side, and
    // navigating first could race proxy.ts into bouncing straight back.
    await signOut();
    router.replace(to(""));
  };

  return (
    // The dot grid belongs to this screen alone: no table to compete with.
    <div className="ground-grid flex min-h-dvh flex-col">
      <main className={`${SHELL} ${PAGE_Y} my-auto`}>
        <header className="flex flex-col-reverse items-start gap-6 lg:flex-row lg:items-center">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
            <Logo size="md" />
            <span aria-hidden className="hidden h-14 w-px bg-line sm:block" />
            <div>
              <h1 className="text-3xl font-bold text-body">¡Hola, {session?.username}!</h1>
              <p className="mt-2 text-body-soft">Selecciona el módulo al que deseas ingresar.</p>
            </div>
          </div>
          <div className="flex w-full flex-col-reverse gap-4 sm:flex-row sm:items-center lg:ml-auto lg:w-auto">
            {canAccessModule(session?.role ?? "receptionist", "clients") && <ClientQuickSearch clients={clients} />}
            {session && <SessionBar session={session} onSignOut={handleSignOut} />}
          </div>
        </header>

        {daily.length > 0 && (
          <section className="mt-[clamp(1.75rem,5vh,3rem)]">
            <TierHeading title="Para el día a día" hint="Lo que se usa en cada turno" />
            <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr_1fr]">
              {daily.map((module) => (
                <DailyModuleCard
                  key={module.id}
                  module={module}
                  pulse={pulse}
                  href={hrefOf(module.route) ?? to("/modules")}
                  shortcutHref={module.shortcut ? to(module.shortcut.route) : undefined}
                />
              ))}
            </div>
          </section>
        )}

        {management.length > 0 && (
          <section className="mt-10">
            <TierHeading title="Gestión del gimnasio" hint="Se revisa cada tanto" />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {management.map((module) => (
                <ManagementModuleCard key={module.id} module={module} href={module.available ? hrefOf(module.route) : null} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
