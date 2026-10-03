import { describe, expect, it } from 'vitest';

import { resolveSetting } from './resolve-setting.js';
import { isSettingKey, SETTING_DEFINITIONS } from './setting-definitions.js';

describe('resolveSetting', () => {
  it('uses the catalog default when nobody changed anything', () => {
    expect(resolveSetting(0, undefined, undefined)).toBe(0);
  });

  it('a general value applies to every gym without an exception', () => {
    expect(resolveSetting(0, { value: 2, enforced: false }, undefined)).toBe(2);
  });

  it("a gym's exception wins over a general value that is not enforced", () => {
    expect(resolveSetting(0, { value: 2, enforced: false }, { value: 3 })).toBe(3);
  });

  it('an exception applies even with no general value', () => {
    expect(resolveSetting(0, undefined, { value: 3 })).toBe(3);
  });

  it('an enforced general value overrides every exception', () => {
    expect(resolveSetting(0, { value: 2, enforced: true }, { value: 3 })).toBe(2);
  });
});

describe('SETTING_DEFINITIONS', () => {
  it('accepts every default it declares', () => {
    for (const definition of Object.values(SETTING_DEFINITIONS)) {
      expect(definition.problem(definition.defaultValue), definition.key).toBeNull();
    }
  });

  it.each([
    ['clients.graceDays', -1],
    ['clients.graceDays', 2.5],
    ['clients.graceDays', '3'],
    ['clients.expiringSoonDays', 0],
    ['modules.enabled', ['clients', 'casino']],
    ['modules.enabled', 'clients'],
  ] as const)('rejects %s = %j', (key, value) => {
    expect(SETTING_DEFINITIONS[key].problem(value)).not.toBeNull();
  });

  it('narrows keys', () => {
    expect(isSettingKey('clients.graceDays')).toBe(true);
    expect(isSettingKey('toString')).toBe(false);
  });
});

describe('blockedModule', () => {
  it('blocks a permission of a module that is off', async () => {
    const { blockedModule } = await import('./module-permissions.js');
    expect(blockedModule('inventario.read', ['clients'])).toBe('inventory');
    expect(blockedModule('clientes.read', ['clients'])).toBeUndefined();
    // Attendance is not a switchable module.
    expect(blockedModule('asistencia.create', [])).toBeUndefined();
  });
});
