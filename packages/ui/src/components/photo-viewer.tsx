"use client";

import Modal from "./modal";

export interface PhotoViewerProps {
  /** Null mientras no se está mirando ninguna. */
  photo: { url: string; name: string } | null;
  onClose: () => void;
}

/**
 * La foto en grande, sobre la página y no en otra pestaña.
 *
 * Abrirla en una pestaña nueva dejaba a la vista la dirección del archivo y
 * obligaba a volver atrás para seguir registrando ingresos.
 */
export default function PhotoViewer({ photo, onClose }: PhotoViewerProps) {
  return (
    <Modal
      open={photo !== null}
      title={photo?.name ?? "Foto"}
      onClose={onClose}
    >
      {photo && (
        <img
          src={photo.url}
          alt={`Foto de ${photo.name}`}
          className="mx-auto max-h-[70vh] rounded-xl border border-line"
        />
      )}
    </Modal>
  );
}
