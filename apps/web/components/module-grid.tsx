"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import type { Module } from "@apexg/core";
import { MODULES, ROLE_LABELS, canAccessModule } from "@apexg/core";
import { Button, Icon } from "@apexg/ui";
import { useSession } from "../lib/use-session";

const CARD_BASE =
  "group rounded-2xl border bg-white p-6 text-left shadow-sm transition-all duration-300";
const CARD_AVAILABLE =
  "cursor-pointer border-slate-200 hover:-translate-y-1 hover:border-blue-400 hover:shadow-lg";
const CARD_DISABLED = "cursor-not-allowed border-slate-200 opacity-50";

function ModuleCard({ module }: { module: Module }) {
  return (
    <>
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        <Icon name={module.icon} size={24} />
      </div>
      <h2 className="font-bold text-slate-900">{module.name}</h2>
      <p className="mt-1 text-sm text-slate-500">{module.description}</p>
      {!module.available && (
        <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Próximamente
        </p>
      )}
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

  const handleSignOut = () => {
    signOut();
    router.replace("/login");
  };

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-blue-600">
              APEX GYM
            </p>
            <h1 className="text-3xl font-bold text-slate-900">
              Selecciona un módulo
            </h1>
            <p className="mt-2 text-slate-500">
              Selecciona el área que deseas administrar.
            </p>
            {session && (
              <p className="mt-1 text-sm text-slate-400">
                {session.username} · {ROLE_LABELS[session.role]}
              </p>
            )}
          </div>
          <Button variant="secondary" onClick={handleSignOut}>
            <LogOut size={18} />
            Cerrar sesión
          </Button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
      </div>
    </main>
  );
}
