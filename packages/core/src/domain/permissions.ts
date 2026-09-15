/**
 * Roles and module access (SRS §2.2).
 *
 * The matrix is data, not conditionals: adding a module means adding it to the
 * lists below, and the server will validate against this same table once the
 * backend exists (RNF-03).
 */

export type Role = "admin" | "receptionist";

/** User-facing role names, in Spanish. */
export const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrador",
  receptionist: "Recepcionista",
};

/**
 * The backend has no fixed "admin"/"receptionist" union — `roleId` is an
 * arbitrary per-company row, and the real authorization decision is a
 * permission-code lookup, not this name (see AuthorizationService on the
 * backend). This only maps the seeded role name the session carries back to
 * the `Role` this module already understands, so the existing matrix above
 * keeps working unchanged. `undefined` for any name outside that seed.
 */
export function roleFromName(name: string): Role | undefined {
  const match = (Object.entries(ROLE_LABELS) as [Role, string][]).find(
    ([, label]) => label === name,
  );
  return match?.[0];
}

/**
 * Modules each role may open, transcribed from the matrix in SRS §2.2.
 *
 * The receptionist gets clients, payments and the daily log. Memberships,
 * trainers, expenses, inventory and consolidated finances are admin-only —
 * §2.2 marks every one of them ✘ for the receptionist.
 *
 * The daily log is its own module rather than a section of Finances precisely
 * because of this: §2.2 grants the receptionist the daily log while denying
 * her Finances, so nesting one inside the other would leak an admin module
 * into her navigation.
 */
const MODULES_BY_ROLE: Record<Role, readonly string[]> = {
  admin: [
    "clients",
    "memberships",
    "payments",
    "trainers",
    "expenses",
    "inventory",
    "finances",
    "dailyLog",
  ],
  receptionist: ["clients", "payments", "dailyLog"],
};

export function canAccessModule(role: Role, moduleId: string): boolean {
  return MODULES_BY_ROLE[role].includes(moduleId);
}

/** Modules the role may open, in catalogue order. */
export function modulesFor(role: Role): readonly string[] {
  return MODULES_BY_ROLE[role];
}

/**
 * Whether the role may create, edit or delete membership types (RF-12).
 *
 * Reading a plan is not the same as managing the catalogue: the receptionist
 * needs prices to register a payment, but may not change them.
 */
export function canManageMemberships(role: Role): boolean {
  return role === "admin";
}

/** Whether the role may see consolidated financial reports (§2.2 note). */
export function canViewFinancialReports(role: Role): boolean {
  return role === "admin";
}

/** Whether the role may register a payment (RF-17). Both roles may. */
export function canRegisterPayments(): boolean {
  return true;
}
