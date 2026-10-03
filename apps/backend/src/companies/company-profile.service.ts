import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { DATABASE } from '../database/database.constants.js';
import type { Database } from '../database/database.types.js';
import { companies } from '../database/schema/schema.js';

import { COMPANY_STATE } from './companies.types.js';
import type { PublicCompanyProfile } from './companies.types.js';
import { isCompanySlug } from './company-slug.js';

const NOT_FOUND = 'Gimnasio no encontrado.';

/** Resolves `<link>/<slug>` to the company behind it. */
@Injectable()
export class CompanyProfileService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async findBySlug(slug: string): Promise<PublicCompanyProfile> {
    // A malformed slug cannot exist: answer like an unknown one, without a query.
    if (!isCompanySlug(slug)) {
      throw new NotFoundException(NOT_FOUND);
    }

    const [company] = await this.db
      .select({
        id: companies.id,
        slug: companies.slug,
        name: companies.name,
        brandColor: companies.primaryColor,
        logoPath: companies.logoPath,
        state: companies.state,
      })
      .from(companies)
      .where(eq(companies.slug, slug));

    if (!company) {
      throw new NotFoundException(NOT_FOUND);
    }

    return {
      id: company.id,
      slug: company.slug,
      name: company.name ?? company.slug,
      brandColor: company.brandColor,
      hasLogo: company.logoPath !== null,
      status: company.state === COMPANY_STATE.active ? 'active' : 'suspended',
    };
  }
}
