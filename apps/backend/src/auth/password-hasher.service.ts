import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

/**
 * Parámetros Argon2id explícitos (política auditable, no valores implícitos):
 *   memoryCost 19456 KiB (19 MiB), timeCost 2, parallelism 1.
 * La librería genera el salt criptográficamente seguro; el hash PHC
 * resultante ya incluye algoritmo, versión, parámetros, salt y hash, por lo
 * que no se guarda salt en columna aparte.
 */
const ARGON2_OPTIONS: argon2.HashOptions = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

@Injectable()
export class PasswordHasherService {
  /** Genera un hash Argon2id de la contraseña (string PHC). */
  hash(password: string): Promise<string> {
    return argon2.hash(password, ARGON2_OPTIONS);
  }

  /** Verifica una contraseña contra un hash PHC. Sin comparación manual. */
  verify(hash: string, password: string): Promise<boolean> {
    return argon2.verify(hash, password);
  }
}
