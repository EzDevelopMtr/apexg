"use client";

import { Modal } from "@apexg/ui";

export interface ReceiptPreviewProps {
  /** Null while nothing is being previewed. */
  receipt: { url: string; fileName: string; clientName: string } | null;
  onClose: () => void;
}

/**
 * The receipt, over the page instead of in another tab.
 *
 * The image is requested with a plain `src`. Same origin, so the browser
 * attaches the session cookie by itself and the proxy adds the token server
 * side — there is no need to fetch it into a blob first, and no token ever
 * reaches this component.
 */
export default function ReceiptPreview({
  receipt,
  onClose,
}: ReceiptPreviewProps) {
  const isPdf = receipt?.fileName.toLowerCase().endsWith(".pdf") ?? false;

  return (
    <Modal
      open={receipt !== null}
      title="Comprobante"
      description={receipt ? `Pago de ${receipt.clientName}` : undefined}
      onClose={onClose}
    >
      {receipt &&
        (isPdf ? (
          // A PDF is not an image: <img> would render nothing at all.
          <object
            data={receipt.url}
            type="application/pdf"
            className="h-[70vh] w-full rounded-xl border border-line"
            aria-label={`Comprobante del pago de ${receipt.clientName}`}
          >
            <p className="p-6 text-center text-body-soft">
              Tu navegador no puede mostrar este PDF aquí.
            </p>
          </object>
        ) : (
          <img
            src={receipt.url}
            alt={`Comprobante del pago de ${receipt.clientName}`}
            className="mx-auto max-h-[70vh] rounded-xl border border-line"
          />
        ))}
    </Modal>
  );
}
