import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { DATABASE } from '../database/database.constants.js';
import type { Database } from '../database/database.types.js';
import { companies } from '../database/schema/schema.js';
import type { StoredFile, UploadedFile } from '../shared/local-file-store.js';

import { brandColorProblem } from './brand-color.js';
// Value import: constructor-injected (see the note in access-token.guard.ts).
import { CompanyLogoStore } from './company-logo.store.js';

export interface BrandChange {
  /** `null` vuelve a los colores de `theme.css`. */
  color?: string | null;
  logo?: UploadedFile;
}

/** Nombre visible, color y logo de un gimnasio. Lo cambia solo el super admin. */
@Injectable()
export class CompanyBrandingService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly logos: CompanyLogoStore,
  ) {}

  async change(slug: string, change: BrandChange): Promise<void> {
    if (typeof change.color === 'string') {
      const problem = brandColorProblem(change.color);
      if (problem) throw new BadRequestException(problem);
    }

    const company = await this.load(slug);
    const logoPath = change.logo ? await this.logos.store(change.logo) : undefined;

    await this.db
      .update(companies)
      .set({
        ...(change.color !== undefined ? { primaryColor: change.color } : {}),
        ...(logoPath ? { logoPath } : {}),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(companies.id, company.id));

    // El logo anterior queda huérfano: se borra después de guardar el nuevo.
    if (logoPath && company.logoPath) await this.logos.discard(company.logoPath);
  }

  async openLogo(slug: string): Promise<StoredFile> {
    const company = await this.load(slug);
    return this.logos.openLogo(company.logoPath ?? '');
  }

  private async load(slug: string): Promise<{ id: string; logoPath: string | null }> {
    const [company] = await this.db
      .select({ id: companies.id, logoPath: companies.logoPath })
      .from(companies)
      .where(eq(companies.slug, slug));
    if (!company) throw new NotFoundException('Gimnasio no encontrado.');
    return company;
  }
}
