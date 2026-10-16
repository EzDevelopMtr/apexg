/**
 * A list another module owns, read as empty when this user may not see it.
 *
 * Egresos and Finanzas also show trainer payouts, but a gym can switch the
 * Trainers module off and a profile can lack it: the API then answers 403.
 * That means "nothing to show here", not "this page is broken". Any other
 * failure still surfaces.
 */
export async function forbiddenAsEmpty<T>(
  request: Promise<readonly T[]>,
): Promise<readonly T[]> {
  try {
    return await request;
  } catch (cause) {
    // Duck-typed so this does not depend on the HTTP layer's error class.
    const status = (cause as { status?: unknown } | null)?.status;
    if (status === 403) return [];
    throw cause;
  }
}
