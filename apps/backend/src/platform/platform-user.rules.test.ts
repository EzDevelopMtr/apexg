import { describe, expect, it } from 'vitest';

import {
  leavesNoAdministrator,
  normalizeUsername,
  usernameProblem,
} from './platform-user.rules.js';

const ADMIN = 'Administrador';
const RECEPTION = 'Recepcionista';

describe('normalizeUsername', () => {
  it('trims and lowercases, like the login does', () => {
    expect(normalizeUsername('  Recepcion.Tarde ')).toBe('recepcion.tarde');
  });
});

describe('usernameProblem', () => {
  it.each(['admin', 'recepcion.tarde', 'ana_ruiz', 'turno-2'])('accepts %s', (username) => {
    expect(usernameProblem(username)).toBeNull();
  });

  it.each([
    ['too short', 'ab'],
    ['too long', 'a'.repeat(51)],
    ['spaces', 'ana ruiz'],
    ['accents', 'recepción'],
    ['an at sign', 'ana@gym'],
  ])('rejects %s', (_, username) => {
    expect(usernameProblem(username)).not.toBeNull();
  });
});

describe('leavesNoAdministrator', () => {
  const users = [
    { id: 'a', roleName: ADMIN, active: true },
    { id: 'r', roleName: RECEPTION, active: true },
  ];

  it('refuses to deactivate the only active administrator', () => {
    expect(leavesNoAdministrator(users, { userId: 'a', active: false })).toBe(true);
  });

  it('refuses to turn the only administrator into a receptionist', () => {
    expect(leavesNoAdministrator(users, { userId: 'a', roleName: RECEPTION })).toBe(true);
  });

  it('allows it once another administrator is active', () => {
    const two = [...users, { id: 'b', roleName: ADMIN, active: true }];
    expect(leavesNoAdministrator(two, { userId: 'a', active: false })).toBe(false);
  });

  it('an inactive administrator does not count', () => {
    const withInactive = [...users, { id: 'b', roleName: ADMIN, active: false }];
    expect(leavesNoAdministrator(withInactive, { userId: 'a', active: false })).toBe(true);
  });

  it('changes to other users are free', () => {
    expect(leavesNoAdministrator(users, { userId: 'r', active: false })).toBe(false);
    expect(leavesNoAdministrator(users, { userId: 'r', roleName: ADMIN })).toBe(false);
  });

  it('promoting someone is what lets the old administrator step down', () => {
    expect(leavesNoAdministrator(users, { userId: 'r', roleName: ADMIN })).toBe(false);
  });
});
