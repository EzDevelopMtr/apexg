"use client";

import WhatsAppGlyph from "./whatsapp-glyph";

export interface ReminderLinkProps {
  /** The `wa.me` link, or `null` when the phone cannot receive WhatsApp. */
  readonly href: string | null;
  readonly clientName: string;
  readonly onOpen: () => void;
}

/** Opens WhatsApp with the renewal reminder written; the desk presses send. */
export default function ReminderLink({ href, clientName, onOpen }: ReminderLinkProps) {
  if (href === null) {
    return <span className="text-xs text-body-soft">Teléfono inválido</span>;
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onOpen}
      aria-label={`Recordar renovación a ${clientName} por WhatsApp`}
      title="Recordar renovación por WhatsApp"
      className="-ml-2 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-body transition hover:bg-fill-2"
    >
      <WhatsAppGlyph size={16} />
      Recordar
    </a>
  );
}
