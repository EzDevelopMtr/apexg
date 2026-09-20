/**
 * Monetary amounts.
 *
 * Money is stored as an **integer number of cents**, never as a float.
 * `0.1 + 0.2 !== 0.3`, and this system computes outstanding balances,
 * installments and accumulated profit (RNF-07: financial calculations must be
 * consistent and traceable).
 *
 * The `Money` brand makes it a type error to pass a raw number where an amount
 * is expected, so a value in pesos can never be mistaken for one in cents.
 */

declare const moneyBrand: unique symbol;

/** An amount in COP cents. Build one with {@link fromCents} or {@link fromPesos}. */
export type Money = number & { readonly [moneyBrand]: true };

const CENTS_PER_PESO = 100;

/** Builds an amount from an integer number of cents. */
export function fromCents(cents: number): Money {
  if (!Number.isInteger(cents)) {
    throw new RangeError(`Money must be a whole number of cents: ${cents}`);
  }
  return cents as Money;
}

/** Builds an amount from pesos, as the SRS §4.1 price table states them. */
export function fromPesos(pesos: number): Money {
  return fromCents(Math.round(pesos * CENTS_PER_PESO));
}

/** The amount in whole pesos, for display or export. */
export function toPesos(amount: Money): number {
  return amount / CENTS_PER_PESO;
}

export const ZERO: Money = fromCents(0);

export function add(a: Money, b: Money): Money {
  return fromCents(a + b);
}

export function subtract(a: Money, b: Money): Money {
  return fromCents(a - b);
}

/** Scales an amount, rounding to the nearest cent. */
export function multiply(amount: Money, factor: number): Money {
  return fromCents(Math.round(amount * factor));
}

export function isZero(amount: Money): boolean {
  return amount === 0;
}

export function isNegative(amount: Money): boolean {
  return amount < 0;
}

export function isGreaterThan(a: Money, b: Money): boolean {
  return a > b;
}

export function isLessThan(a: Money, b: Money): boolean {
  return a < b;
}

/** Clamps an amount at zero, so a balance never renders as negative. */
export function atLeastZero(amount: Money): Money {
  return isNegative(amount) ? ZERO : amount;
}

const COP_FORMATTER = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** Formats an amount as Colombian pesos, e.g. `$ 65.000`. */
export function formatCOP(amount: Money): string {
  return COP_FORMATTER.format(toPesos(amount));
}

const API_MONEY_PATTERN = /^-?\d+\.\d{2}$/;

/**
 * Parses the string a `NUMERIC(_,2)` column comes back as over HTTP (the
 * backend never sends a JSON number for money — see its own CLAUDE.md). The
 * backend guarantees this exact shape, so a mismatch means something is
 * genuinely wrong rather than a case to handle gracefully.
 */
export function fromApiString(value: string): Money {
  if (!API_MONEY_PATTERN.test(value)) {
    throw new RangeError(`Not a valid API money string: "${value}"`);
  }
  const negative = value.startsWith("-");
  const [whole = "0", fraction = "0"] = (
    negative ? value.slice(1) : value
  ).split(".");
  const cents = Number(whole) * CENTS_PER_PESO + Number(fraction);
  return fromCents(negative ? -cents : cents);
}

/** The inverse of {@link fromApiString} — what a `NUMERIC(_,2)` body field expects. */
export function toApiString(amount: Money): string {
  const negative = isNegative(amount);
  const absolute = Math.abs(amount);
  const whole = Math.floor(absolute / CENTS_PER_PESO);
  const fraction = String(absolute % CENTS_PER_PESO).padStart(2, "0");
  return `${negative ? "-" : ""}${whole}.${fraction}`;
}
