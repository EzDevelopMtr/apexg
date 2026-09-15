import { Injectable, UnauthorizedException } from '@nestjs/common';

interface AttemptRecord {
  count: number;
  firstAttemptAt: number;
  lockedUntil: number | null;
}

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const LOCKOUT_MS = 15 * 60 * 1000;

const TOO_MANY_ATTEMPTS = 'Demasiados intentos. Intenta de nuevo en unos minutos.';

/**
 * Brute-force guard for `POST /auth/login` (no rate limiting existed before
 * this). Keyed by `companyId:username`, not by IP: the real client IP never
 * reaches this backend — `apps/frontend/app/api/auth/login/route.ts` calls
 * it server-to-server, so every request would otherwise look like it comes
 * from the same address regardless of who is actually attacking. Keying by
 * the account being targeted also means a nonexistent username locks out
 * exactly like a real one, so this adds no way to probe which usernames exist.
 *
 * In-memory, per process — resets on deploy/restart, and does not carry a
 * lockout across multiple backend instances. Correct for this app's single
 * instance today; revisit (e.g. a shared store) before running more than one.
 */
@Injectable()
export class LoginRateLimiterService {
  private readonly attempts = new Map<string, AttemptRecord>();

  assertNotLocked(key: string): void {
    const lockedUntil = this.attempts.get(key)?.lockedUntil ?? 0;
    if (lockedUntil > Date.now()) {
      throw new UnauthorizedException(TOO_MANY_ATTEMPTS);
    }
  }

  recordFailure(key: string): void {
    const now = Date.now();
    const entry = this.attempts.get(key);

    if (!entry || now - entry.firstAttemptAt > WINDOW_MS) {
      this.attempts.set(key, { count: 1, firstAttemptAt: now, lockedUntil: null });
      return;
    }

    const count = entry.count + 1;
    const lockedUntil = count >= MAX_ATTEMPTS ? now + LOCKOUT_MS : null;
    this.attempts.set(key, { count, firstAttemptAt: entry.firstAttemptAt, lockedUntil });
  }

  recordSuccess(key: string): void {
    this.attempts.delete(key);
  }
}
