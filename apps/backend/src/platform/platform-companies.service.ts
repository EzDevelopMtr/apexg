import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { asc, eq, sql } from 'drizzle-orm';

import { COMPANY_STATE } from '../companies/companies.types.js';
import { isCompanySlug } from '../companies/company-slug.js';
import { DATABASE } from '../database/database.constants.js';
import type { Database } from '../database/database.types.js';
import { companies } from '../database/schema/schema.js';
import { pgErrorCode, PG_UNIQUE_VIOLATION } from '../shared/pg-error.util.js';

import type { UpdatePlatformCompanyDto } from './platform-company.dto.js';
import type { PlatformCompanyRow } from './platform-companies.types.js';

const NOT_FOUND = 'Gimnasio no encontrado.';
const BAD_SLUG =
  'El identificador debe tener 3 a 40 caracteres: minúsculas, dígitos y guiones, y no puede ser una ruta de la app.';

/** Lectura y cambios de gimnasios que no son de marca. */
@Injectable()
export class PlatformCompaniesService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async list(): Promise<PlatformCompanyRow[]> {
    const rows = await this.db
      .select({
        id: companies.id,
        slug: companies.slug,
        name: companies.name,
        state: companies.state,
        brandColor: companies.primaryColor,
        logoPath: companies.logoPath,
        createdAt: companies.createdAt,
        // Columna escrita completa: interpolada, Drizzle la deja sin tabla y
        // dentro de la subconsulta apuntaba a c.id / u.id (siempre 0).
        activeClients: sql<number>`(SELECT count(*)::int FROM clients c WHERE c.company_id = "companies"."id" AND c.state = 1)`,
        users: sql<number>`(SELECT count(*)::int FROM users u WHERE u.company_id = "companies"."id" AND u.state = 1)`,
      })
      .from(companies)
      .orderBy(asc(companies.name));
    return rows.map(({ state, logoPath, name, ...row }) => ({
      ...row,
      name: name ?? row.slug,
      status: state === COMPANY_STATE.active ? 'active' : 'suspended',
      hasLogo: logoPath !== null,
    }));
  }

  /** Devuelve el slug vigente: la marca se cambia por él. */
  async slugOf(id: string): Promise<string> {
    const [company] = await this.db
      .select({ slug: companies.slug })
      .from(companies)
      .where(eq(companies.id, id));
    if (!company) throw new NotFoundException(NOT_FOUND);
    return company.slug;
  }

  async update(id: string, change: UpdatePlatformCompanyDto): Promise<void> {
    await this.slugOf(id);
    if (change.slug !== undefined && !isCompanySlug(change.slug)) {
      throw new BadRequestException(BAD_SLUG);
    }
    try {
      await this.db
        .update(companies)
        .set({
          ...(change.name !== undefined ? { name: change.name.trim() } : {}),
          ...(change.slug !== undefined ? { slug: change.slug } : {}),
          ...(change.status !== undefined ? { state: COMPANY_STATE[change.status] } : {}),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(companies.id, id));
    } catch (error) {
      if (pgErrorCode(error) === PG_UNIQUE_VIOLATION) {
        throw new ConflictException(`Ya existe un gimnasio con el identificador "${change.slug}".`);
      }
      throw error;
    }
  }
}
