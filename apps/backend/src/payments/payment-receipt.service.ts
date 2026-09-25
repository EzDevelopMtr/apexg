import { BadRequestException, Injectable } from "@nestjs/common";

import { LocalFileStore } from "../shared/local-file-store.js";
import type { StoredFile, UploadedFile } from "../shared/local-file-store.js";

/** Solo imágenes y PDF: es una captura de app bancaria o un recibo escaneado. */
const ALLOWED = new Map<string, string>([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["application/pdf", ".pdf"],
]);

const MAX_BYTES = 5 * 1024 * 1024;

/** La variable de entorno existe para apuntar a un volumen montado sin tocar código. */
const RECEIPTS_DIR = process.env.RECEIPTS_DIR ?? "data/receipts";

const NOT_FOUND = "El comprobante no existe.";

/**
 * Comprobantes de pago en disco.
 *
 * El guardado, el nombrado y la validación de ruta viven en
 * {@link LocalFileStore}, compartidos con las fotos de cliente: son la parte
 * delicada, y duplicarla significaba arreglar un traversal en un sitio y
 * dejarlo abierto en el otro. Aquí queda solo lo que es propio de un
 * comprobante — qué formatos valen y cuándo es obligatorio.
 */
@Injectable()
export class PaymentReceiptService extends LocalFileStore {
  constructor() {
    super(
      RECEIPTS_DIR,
      ALLOWED,
      MAX_BYTES,
      "El comprobante debe ser una imagen (JPG, PNG, WEBP) o un PDF.",
    );
  }

  /**
   * Aplica la regla y guarda: devuelve el nombre a persistir, o null.
   *
   * Espejo de `requiresReceipt` en `@apexg/core`, que es la fuente: lo exige
   * todo menos el efectivo, que cambia de manos con la recepcionista delante.
   * Se repite porque este backend no depende de ese paquete, y la API tiene
   * que rechazar lo mismo que el formulario — si no, la exigencia solo vale
   * mientras se use nuestra UI.
   */
  async storeFor(
    method: string,
    file?: UploadedFile,
  ): Promise<string | null> {
    if (!file) {
      if (method !== "cash") {
        throw new BadRequestException(
          "Adjunta el comprobante: es obligatorio si el pago no es en efectivo.",
        );
      }
      return null;
    }
    // Un pago en efectivo con soporte adjunto se acepta: sobra evidencia, no
    // falta.
    return this.store(file);
  }

  /** Abre un comprobante ya guardado. */
  openReceipt(name: string): StoredFile {
    return this.open(name, NOT_FOUND);
  }
}
