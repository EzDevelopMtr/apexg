import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { DATABASE } from '../database/database.constants.js';
import type { Database } from '../database/database.types.js';
import { companies, companySettings, platformSettings } from '../database/schema/schema.js';

import { resolveSetting } from './resolve-setting.js';
import { isSettingKey, SETTING_DEFINITIONS } from './setting-definitions.js';
import type { CompanySettings, SettingKey } from './setting-definitions.js';

/** Cuánto vive en memoria lo resuelto. Una escritura lo invalida antes. */
const CACHE_MS = 30_000;

export interface SettingOverview {
  key: SettingKey;
  defaultValue: unknown;
  platform: { value: unknown; enforced: boolean } | null;
  overrides: { companyId: string; slug: string; name: string; value: unknown }[];
}

/** Lee, resuelve y guarda ajustes. Ver 023 para el orden de resolución. */
@Injectable()
export class SettingsService {
  readonly #cache = new Map<string, { at: number; settings: CompanySettings }>();

  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async forCompany(companyId: string): Promise<CompanySettings> {
    const cached = this.#cache.get(companyId);
    if (cached && Date.now() - cached.at < CACHE_MS) return cached.settings;

    const [general, own] = await Promise.all([
      this.db.select().from(platformSettings),
      this.db.select().from(companySettings).where(eq(companySettings.companyId, companyId)),
    ]);
    const platformByKey = new Map(general.map((row) => [row.key, row]));
    const ownByKey = new Map(own.map((row) => [row.key, row]));

    const entries = Object.values(SETTING_DEFINITIONS).map((definition) => [
      definition.key,
      resolveSetting<unknown>(
        definition.defaultValue,
        platformByKey.get(definition.key),
        ownByKey.get(definition.key),
      ),
    ]);
    const settings = Object.fromEntries(entries) as CompanySettings;
    this.#cache.set(companyId, { at: Date.now(), settings });
    return settings;
  }

  async overview(): Promise<SettingOverview[]> {
    const [general, overrides] = await Promise.all([
      this.db.select().from(platformSettings),
      this.db
        .select({
          key: companySettings.key,
          value: companySettings.value,
          companyId: companies.id,
          slug: companies.slug,
          name: companies.name,
        })
        .from(companySettings)
        .innerJoin(companies, eq(companies.id, companySettings.companyId)),
    ]);
    return Object.values(SETTING_DEFINITIONS).map((definition) => {
      const platform = general.find((row) => row.key === definition.key);
      return {
        key: definition.key,
        defaultValue: definition.defaultValue,
        platform: platform ? { value: platform.value, enforced: platform.enforced } : null,
        overrides: overrides
          .filter((row) => row.key === definition.key)
          .map((row) => ({ ...row, name: row.name ?? row.slug })),
      };
    });
  }

  async setPlatform(adminId: string, key: string, value: unknown, enforced: boolean): Promise<void> {
    const valid = this.validated(key, value);
    const row = { value: valid, enforced, updatedBy: adminId, updatedAt: new Date().toISOString() };
    await this.db
      .insert(platformSettings)
      .values({ key, ...row })
      .onConflictDoUpdate({ target: platformSettings.key, set: row });
    this.#cache.clear();
  }

  async clearPlatform(key: string): Promise<void> {
    await this.db.delete(platformSettings).where(eq(platformSettings.key, key));
    this.#cache.clear();
  }

  async setOverride(adminId: string, companyId: string, key: string, value: unknown): Promise<void> {
    const valid = this.validated(key, value);
    const row = { value: valid, updatedBy: adminId, updatedAt: new Date().toISOString() };
    await this.db
      .insert(companySettings)
      .values({ companyId, key, ...row })
      .onConflictDoUpdate({ target: [companySettings.companyId, companySettings.key], set: row });
    this.#cache.delete(companyId);
  }

  async clearOverride(companyId: string, key: string): Promise<void> {
    await this.db
      .delete(companySettings)
      .where(and(eq(companySettings.companyId, companyId), eq(companySettings.key, key)));
    this.#cache.delete(companyId);
  }

  private validated(key: string, value: unknown): unknown {
    if (!isSettingKey(key)) throw new BadRequestException(`Ajuste desconocido: ${key}.`);
    const problem = SETTING_DEFINITIONS[key].problem(value);
    if (problem) throw new BadRequestException(problem);
    return value;
  }
}
