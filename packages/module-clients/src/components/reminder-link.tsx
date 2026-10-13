"use client";

import { MessageCircle } from "lucide-react";

export interface ReminderLinkProps {
  /** The `wa.me` link, or `null` when the phone cannot receive WhatsApp. */
  readonly href: string | null;
  readonly clientName: string;
  /** "Recordado hoy", when someone already wrote. */
  readonly notice?: string;
  /** Who wrote, for the tooltip. */
  readonly sentByName?: string | null;
  readonly onOpen: () => void;
}

/** Opens WhatsApp with the renewal reminder written; the desk presses send. */
export default function ReminderLink({ href, clientName, notice, sentByName, onOpen }: ReminderLinkProps) {
  if (href === null) {
    return <span className="text-xs text-body-soft">Teléfono inválido</span>;
  }
  return (
    <span className="flex flex-wrap items-center gap-x-2">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onOpen}
        aria-label={`Recordar renovación a ${clientName} por WhatsApp`}
        title="Recordar renovación por WhatsApp"
        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-brand-ink transition hover:bg-fill-2"
      >
        <MessageCircle size={14} />
        Recordar
      </a>
      {notice && (
        <span className="text-xs text-body-soft" title={sentByName ? `Por ${sentByName}` : undefined}>
          {notice}
        </span>
      )}
    </span>
  );
}
