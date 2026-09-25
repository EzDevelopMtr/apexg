import { Injectable } from "@nestjs/common";

import { LocalFileStore } from "../shared/local-file-store.js";
import type { StoredFile } from "../shared/local-file-store.js";

/**
 * Solo imágenes, sin PDF: esto es una cara en una fila de una lista, y un PDF
 * no se puede pintar dentro de un avatar de cuarenta píxeles.
 */
const ALLOWED = new Map<string, string>([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
]);

/**
 * Más apretado que los 5 MB de un comprobante: una foto de carnet tomada con
 * el celular pesa menos de 2 MB, y el límite alto solo invitaba a subir la
 * original de 12 megapíxeles.
 */
const MAX_BYTES = 2 * 1024 * 1024;

const PHOTOS_DIR = process.env.CLIENT_PHOTOS_DIR ?? "data/client-photos";

const NOT_FOUND = "Ese cliente no tiene foto.";

/**
 * Fotos de cliente en disco.
 *
 * Carpeta propia y fuera de `public/`, igual que los comprobantes: la cara de
 * una persona —a veces de un menor— no se sirve por una URL adivinable. La
 * ruta que la entrega comprueba que el cliente sea de esta empresa.
 */
@Injectable()
export class ClientPhotoService extends LocalFileStore {
  constructor() {
    super(
      PHOTOS_DIR,
      ALLOWED,
      MAX_BYTES,
      "La foto debe ser una imagen JPG, PNG o WEBP.",
    );
  }

  openPhoto(name: string): StoredFile {
    return this.open(name, NOT_FOUND);
  }
}
