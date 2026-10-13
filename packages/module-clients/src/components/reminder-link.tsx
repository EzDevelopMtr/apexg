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
      className="inline-grid size-9 place-items-center rounded-lg transition hover:bg-fill-2 active:scale-90"
    >
      <WhatsAppGlyph size={24} />
    </a>
  );
}
