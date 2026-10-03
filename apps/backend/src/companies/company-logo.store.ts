import { Injectable } from '@nestjs/common';

import { LocalFileStore } from '../shared/local-file-store.js';
import type { StoredFile } from '../shared/local-file-store.js';

/** SVG para que se vea nítido a cualquier tamaño; PNG/WEBP si no hay vector. */
const ALLOWED = new Map<string, string>([
  ['image/svg+xml', '.svg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
]);

const MAX_BYTES = 512 * 1024;

/** La variable de entorno existe para apuntar a un volumen montado sin tocar código. */
const LOGOS_DIR = process.env.COMPANY_LOGOS_DIR ?? 'data/company-logos';

/** Logos de gimnasio en disco. Son públicos: se ven en la página de login. */
@Injectable()
export class CompanyLogoStore extends LocalFileStore {
  constructor() {
    super(LOGOS_DIR, ALLOWED, MAX_BYTES, 'El logo debe ser SVG, PNG o WEBP.');
  }

  openLogo(name: string): StoredFile {
    return this.open(name, 'El gimnasio no tiene logo.');
  }
}
