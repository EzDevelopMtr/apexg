/** A company's identifier in the URL: `apex-gym` in `<link>/apex-gym`. */
export type CompanySlug = string & { readonly __brand: 'CompanySlug' };

export const COMPANY_SLUG_MIN_LENGTH = 3;
export const COMPANY_SLUG_MAX_LENGTH = 40;

/** Lowercase letters and digits, words joined by single hyphens. */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Top-level routes of `apps/frontend/app`. A company with one of these slugs
 * would be unreachable: Next resolves the static route before `[gym]`.
 * `company-slug.test.ts` fails if a frontend route is missing here.
 */
export const RESERVED_COMPANY_SLUGS: ReadonlySet<string> = new Set([
  'admin',
  'api',
  'dashboard',
  'login',
  'logout',
  'modules',
]);

/** Whether `value` can identify a company in the URL. */
export function isCompanySlug(value: string): value is CompanySlug {
  return (
    value.length >= COMPANY_SLUG_MIN_LENGTH &&
    value.length <= COMPANY_SLUG_MAX_LENGTH &&
    SLUG_PATTERN.test(value) &&
    !RESERVED_COMPANY_SLUGS.has(value)
  );
}
