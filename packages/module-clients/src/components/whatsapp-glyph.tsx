import { siWhatsapp } from "simple-icons";

/** WhatsApp's own logo, in its own green (`--color-whatsapp`), so the desk recognises it at a glance. */
export default function WhatsAppGlyph({ size }: { readonly size: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" className="shrink-0 fill-whatsapp">
      <path d={siWhatsapp.path} />
    </svg>
  );
}
