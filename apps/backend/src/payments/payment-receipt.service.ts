import { randomUUID } from "node:crypto";
import { createReadStream, existsSync } from "node:fs";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import type { ReadStream } from "node:fs";

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

/** Solo imágenes y PDF: es una captura de app bancaria o un recibo escaneado. */
const ALLOWED = new Map<string, string>([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["application/pdf", ".pdf"],
]);

const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Comprobantes de pago en disco local.
 *
 * Toda la escritura y lectura de archivos vive AQUÍ y no en `PaymentsService`,
 * para que cambiar disco por S3 o Supabase Storage sea reemplazar esta clase
 * sin tocar la lógica de pagos.
 *
 * Dos decisiones de seguridad que no son negociables:
 *
 * 1. El nombre en disco lo generamos nosotros (`randomUUID` + extensión
 *    derivada del MIME declarado). El nombre que manda el cliente NUNCA toca
 *    el sistema de archivos: es la vía clásica de un path traversal
 *    (`../../etc/passwd`) y además puede colisionar entre clientes distintos.
 * 2. La carpeta queda fuera de `public/`. Un comprobante lleva el dinero de
 *    una persona, así que se sirve por una ruta que comprueba permisos, no
 *    por una URL que cualquiera con el enlace pueda abrir.
 */
@Injectable()
export class PaymentReceiptService {
  readonly #directory = resolve(process.cwd(), "apps/backend/data/receipts");

  /** Guarda el archivo y devuelve el nombre a persistir en `receipt_path`. */
  async store(file: {
    mimetype: string;
    size: number;
    buffer: Buffer;
  }): Promise<string> {
    const extension = ALLOWED.get(file.mimetype);
    if (!extension) {
      throw new BadRequestException(
        "El comprobante debe ser una imagen (JPG, PNG, WEBP) o un PDF.",
      );
    }
    if (file.size > MAX_BYTES) {
      throw new BadRequestException("El comprobante no puede superar 5 MB.");
    }

    await mkdir(this.#directory, { recursive: true });
    const name = `${randomUUID()}${extension}`;
    await writeFile(join(this.#directory, name), file.buffer);
    return name;
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
    file?: { mimetype: string; size: number; buffer: Buffer },
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

  /**
   * Abre un comprobante ya guardado.
   *
   * Recibe solo el nombre que nosotros generamos y lo valida contra el patrón
   * de UUID antes de tocar el disco: aunque hoy ese valor venga de la base,
   * concatenar a una ruta algo que no se ha comprobado es como se abren los
   * traversals cuando alguien más reutiliza este método mañana.
   */
  open(name: string): { stream: ReadStream; contentType: string } {
    const extension = extname(name);
    const contentType = [...ALLOWED].find(([, ext]) => ext === extension)?.[0];
    if (!contentType || !/^[0-9a-f-]{36}\./i.test(name)) {
      throw new NotFoundException("El comprobante no existe.");
    }

    const path = join(this.#directory, name);
    if (!existsSync(path)) {
      throw new NotFoundException("El comprobante no existe.");
    }
    return { stream: createReadStream(path), contentType };
  }

  /** Borra un comprobante huérfano; el fallo no debe tumbar la transacción. */
  async discard(name: string): Promise<void> {
    await unlink(join(this.#directory, name)).catch(() => undefined);
  }
}
