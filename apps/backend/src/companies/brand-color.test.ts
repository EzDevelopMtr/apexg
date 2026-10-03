import { describe, expect, it } from 'vitest';

import { brandColorProblem } from './brand-color.js';

// Mismas muestras que packages/core/src/domain/brand.test.ts: si una regla
// cambia allá, este test debe cambiar con ella.
describe('brandColorProblem', () => {
  it.each(['#306e9d', '#7c3aed', '#0e9aa7', '#c026d3', '#6b7280'])('accepts %s', (color) => {
    expect(brandColorProblem(color)).toBeNull();
  });

  it.each(['#dc2626', '#f97316', '#f59e0b', '#22c55e', '#84cc16'])(
    'rejects the status hue %s',
    (color) => {
      expect(brandColorProblem(color)).toMatch(/reservados/);
    },
  );

  it.each(['306e9d', '#306E9D', '#36e'])('rejects the malformed %s', (color) => {
    expect(brandColorProblem(color)).toMatch(/formato/);
  });
});
