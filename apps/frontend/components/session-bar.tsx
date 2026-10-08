"use client";

import { LogOut } from "lucide-react";
import { ROLE_LABELS } from "@apexg/core";
import { Button } from "@apexg/ui";
import type { Session } from "../lib/session-context";

/** Who is signed in, and the way out. */
export default function SessionBar({ session, onSignOut }: { session: Session; onSignOut: () => void }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-brand-ink text-sm font-bold uppercase text-brand-ink">
        {session.username.slice(0, 2)}
      </span>
      <span className="hidden text-left sm:block">
        <span className="block text-sm font-semibold text-body">{session.username}</span>
        <span className="block text-xs text-body-soft">{ROLE_LABELS[session.role]}</span>
      </span>
      {/* The pull cancels the button's own padding, so its label ends on the
          same axis as the cards below instead of 1rem inside them. */}
      <Button variant="ghost" size="sm" onClick={onSignOut} className="-mr-4" aria-label="Cerrar sesión">
        <LogOut size={18} />
        <span className="hidden whitespace-nowrap sm:inline">Cerrar sesión</span>
      </Button>
    </div>
  );
}
