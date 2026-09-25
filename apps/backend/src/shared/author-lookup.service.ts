import { Inject, Injectable } from "@nestjs/common";
import { inArray } from "drizzle-orm";

import { DATABASE } from "../database/database.constants.js";
import type { Database } from "../database/database.types.js";
import { users } from "../database/schema/schema.js";

/**
 * Lo que se muestra cuando la fila no tiene autor.
 *
 * Los registros anteriores a que se guardara quién hacía cada cosa no tienen
 * a quién atribuirse, e inventarle un nombre sería peor que decirlo.
 */
export const UNKNOWN_AUTHOR = "—";

/** El nombre ya resuelto, o el guion de "no se sabe". */
export function authorName(
  names: Map<string, string>,
  id: string | null,
): string {
  return id === null ? UNKNOWN_AUTHOR : (names.get(id) ?? UNKNOWN_AUTHOR);
}

/**
 * De ids de usuario a nombres, para el rastro de quién hizo qué (RNF-07).
 *
 * Una consulta aparte y no un JOIN en cada servicio: los `select()` de pagos,
 * egresos y ventas traen la fila entera, y añadirles un join cambia la forma
 * del resultado y obliga a reescribir cada mapeador. Además, veinte pagos de
 * la misma recepcionista se resuelven con una sola lectura.
 */
@Injectable()
export class AuthorLookupService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async namesOf(ids: readonly (string | null)[]): Promise<Map<string, string>> {
    const unique = [...new Set(ids.filter((id): id is string => id !== null))];
    if (unique.length === 0) return new Map();

    const rows = await this.db
      .select({ id: users.id, fullName: users.fullName })
      .from(users)
      .where(inArray(users.id, unique));

    return new Map(rows.map((row) => [row.id, row.fullName]));
  }

  /** El nombre de un solo autor, ya resuelto. */
  async nameOf(id: string | null): Promise<string> {
    if (id === null) return UNKNOWN_AUTHOR;
    const names = await this.namesOf([id]);
    return names.get(id) ?? UNKNOWN_AUTHOR;
  }
}
