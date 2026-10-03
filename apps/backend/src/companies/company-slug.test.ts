import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { isCompanySlug, RESERVED_COMPANY_SLUGS } from './company-slug.js';

const FRONTEND_APP = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../../frontend/app',
);

/** Static top-level segments, looking through `(group)` folders. */
function topLevelRoutes(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) => {
      if (entry.name.startsWith('(')) {
        return topLevelRoutes(join(directory, entry.name));
      }
      return entry.name.startsWith('[') ? [] : [entry.name];
    });
}

describe('isCompanySlug', () => {
  it.each(['apex-gym', 'gym', 'gimnasio-x-2', 'a1b'])('accepts %s', (slug) => {
    expect(isCompanySlug(slug)).toBe(true);
  });

  it.each([
    ['too short', 'ab'],
    ['too long', 'a'.repeat(41)],
    ['uppercase', 'Apex-Gym'],
    ['spaces', 'apex gym'],
    ['accents', 'gimnasio-acción'],
    ['leading hyphen', '-apex'],
    ['trailing hyphen', 'apex-'],
    ['double hyphen', 'apex--gym'],
    ['underscore', 'apex_gym'],
    ['a dot, like a public file', 'favicon.svg'],
    ['a reserved route', 'login'],
  ])('rejects %s', (_, slug) => {
    expect(isCompanySlug(slug)).toBe(false);
  });
});

describe('RESERVED_COMPANY_SLUGS', () => {
  it('covers every top-level frontend route', () => {
    const routes = topLevelRoutes(FRONTEND_APP);
    expect(routes.length).toBeGreaterThan(0);
    for (const route of routes) {
      expect(RESERVED_COMPANY_SLUGS, `route "${route}"`).toContain(route);
    }
  });
});
