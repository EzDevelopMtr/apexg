import { mkdtempSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { LocalFileStore } from './local-file-store.js';

class TestStore extends LocalFileStore {
  constructor(readonly root: string) {
    super(root, new Map([['image/png', '.png']]), 1024, 'Solo PNG.');
  }
}

const COMPANY = '40a7561d-d7c6-40dc-b36f-22c1382ca142';
const png = { mimetype: 'image/png', size: 4, buffer: Buffer.from('fake') };

describe('LocalFileStore', () => {
  it('stores each file under its gym folder', async () => {
    const store = new TestStore(mkdtempSync(join(tmpdir(), 'apexg-store-')));
    const name = await store.store(png, COMPANY);
    expect(name).toMatch(new RegExp(`^${COMPANY}/[0-9a-f-]{36}[.]png$`));
    expect(existsSync(join(store.root, name))).toBe(true);
    expect(store.open(name, 'falta').contentType).toBe('image/png');
  });

  it('refuses a folder that is not a gym id', async () => {
    const store = new TestStore(mkdtempSync(join(tmpdir(), 'apexg-store-')));
    await expect(store.store(png, '../otro')).rejects.toThrow();
  });

  it.each(['../secret.png', `${COMPANY}/../../x.png`, 'a/b/c.png'])(
    'never opens a crafted name: %s',
    (name) => {
      const store = new TestStore(tmpdir());
      expect(() => store.open(name, 'falta')).toThrow('falta');
    },
  );
});
