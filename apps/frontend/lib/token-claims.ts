/**
 * Reads a JWT's claims WITHOUT verifying its signature. Only for routing
 * decisions (is it expired, which gym is it for): every request still goes
 * to the backend, which verifies the signature and re-reads the user. Plain
 * code, so `proxy.ts` can import it too.
 */
export interface TokenClaims {
  readonly exp?: number;
  readonly companyId?: string;
}

export function tokenClaims(token: string): TokenClaims | undefined {
  const segments = token.split(".");
  const payload = segments[1];
  if (segments.length !== 3 || !payload) return undefined;
  try {
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    return JSON.parse(atob(padded)) as TokenClaims;
  } catch {
    return undefined;
  }
}

export function isUnexpired(token: string | undefined): boolean {
  const exp = token ? tokenClaims(token)?.exp : undefined;
  return typeof exp === "number" && exp * 1000 > Date.now();
}
