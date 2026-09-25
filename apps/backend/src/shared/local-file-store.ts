import { randomUUID } from "node:crypto";
import { createReadStream, existsSync } from "node:fs";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import type { ReadStream } from "node:fs";

import { BadRequestException, NotFoundException } from "@nestjs/common";

export interface UploadedFile {
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface StoredFile {
  stream: ReadStream;
  contentType: string;
}

/**
 * Archivos subidos, en disco local.
 *
 * Toda la escritura y lectura vive AQUÍ y no en los servicios de negocio,
 * para que cambiar disco por S3 o Supabase Storage sea reemplazar esta clase
 * sin tocar pagos ni clientes.
 *
 * Dos decisiones de seguridad que no son negociables:
 *
 * 1. El nombre en disco lo generamos nosotros (`randomUUID` + extensión
 *    derivada del MIME declarado). El nombre que manda el cliente NUNCA toca
 *    el sistema de archivos: es la vía clásica de un path traversal
 *    (`../../etc/passwd`) y además puede colisionar entre clientes distintos.
 * 2. La carpeta queda fuera de `public/`. Lo que se guarda aquí son datos de
 *    personas, así que se sirve por una ruta que comprueba permisos, no por
 *    una URL que cualquiera con el enlace pueda abrir.
 *
 * Es una clase base y no un `@Injectable` compartido porque cada tipo de
 * archivo tiene su carpeta, sus formatos y su mensaje de error: un
 * comprobante admite PDF y una foto de perfil no.
 */
export abstract class LocalFileStore {
  readonly #directory: string;
  readonly #allowed: Map<string, string>;
  readonly #maxBytes: number;
  readonly #rejection: string;

  /**
   * @param directory Relativo al cwd, que al arrancar con
   *   `pnpm --filter @apexg/backend` ya es `apps/backend` — dar la ruta desde
   *   la raíz del repo la duplicaba (`apps/backend/apps/backend/data/...`) y
   *   dejaba la carpeta fuera de lo que `.gitignore` cubre.
   * @param allowed MIME declarado → extensión que le ponemos nosotros.
   * @param rejection Qué se le dice a quien sube algo de otro tipo.
   */
  protected constructor(
    directory: string,
    allowed: Map<string, string>,
    maxBytes: number,
    rejection: string,
  ) {
    this.#directory = resolve(process.cwd(), directory);
    this.#allowed = allowed;
    this.#maxBytes = maxBytes;
    this.#rejection = rejection;
  }

  /** Guarda el archivo y devuelve el nombre a persistir. */
  async store(file: UploadedFile): Promise<string> {
    const extension = this.#allowed.get(file.mimetype);
    if (!extension) {
      throw new BadRequestException(this.#rejection);
    }
    if (file.size > this.#maxBytes) {
      const mb = Math.round(this.#maxBytes / (1024 * 1024));
      throw new BadRequestException(`El archivo no puede superar ${mb} MB.`);
    }

    await mkdir(this.#directory, { recursive: true });
    const name = `${randomUUID()}${extension}`;
    await writeFile(join(this.#directory, name), file.buffer);
    return name;
  }

  /**
   * Abre un archivo ya guardado.
   *
   * Recibe solo el nombre que nosotros generamos y lo valida contra el patrón
   * de UUID antes de tocar el disco: aunque hoy ese valor venga de la base,
   * concatenar a una ruta algo que no se ha comprobado es como se abren los
   * traversals cuando alguien más reutiliza este método mañana.
   */
  open(name: string, missing: string): StoredFile {
    const extension = extname(name);
    const contentType = [...this.#allowed].find(
      ([, ext]) => ext === extension,
    )?.[0];
    if (!contentType || !/^[0-9a-f-]{36}\./i.test(name)) {
      throw new NotFoundException(missing);
    }

    const path = join(this.#directory, name);
    if (!existsSync(path)) {
      throw new NotFoundException(missing);
    }
    return { stream: createReadStream(path), contentType };
  }

  /** Borra un archivo huérfano; el fallo no debe tumbar la transacción. */
  async discard(name: string): Promise<void> {
    await unlink(join(this.#directory, name)).catch(() => undefined);
  }
}
