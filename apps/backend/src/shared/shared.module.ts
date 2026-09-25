import { Global, Module } from "@nestjs/common";

import { AuthorLookupService } from "./author-lookup.service.js";

/**
 * Lo que necesitan varios módulos de negocio sin pertenecer a ninguno.
 *
 * `@Global` porque el rastro de autoría (RNF-07) lo escribe casi todo módulo:
 * declararlo en cada uno solo repetiría la misma línea seis veces.
 */
@Global()
@Module({
  providers: [AuthorLookupService],
  exports: [AuthorLookupService],
})
export class SharedModule {}
