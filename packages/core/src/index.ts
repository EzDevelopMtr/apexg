/**
 * `@apexg/core` — the domain.
 *
 * No React, no Next, no data access. Everything here runs in a plain Node test,
 * which is what makes the financial rules in SRS §4 verifiable (RNF-07).
 */

/* Primitives */
export * from "./domain/money";
export * from "./domain/calendar";

/* Entities */
export * from "./domain/client";
export * from "./domain/attendance";
export * from "./domain/membership";
export * from "./domain/membership-catalog";
export * from "./domain/payment";
export * from "./domain/trainer";
export * from "./domain/expense";
export * from "./domain/inventory";
export * from "./domain/product-sale";
export * from "./domain/finance";

/* Access control */
export * from "./domain/permissions";

/* Navigation */
export * from "./navigation/accents";
export * from "./navigation/icons";
export * from "./navigation/modules";
export * from "./navigation/client-sections";
export * from "./navigation/section-catalog";
export * from "./navigation/membership-sections";
export * from "./navigation/payment-sections";
export * from "./navigation/trainer-sections";
export * from "./navigation/expense-sections";
export * from "./navigation/inventory-sections";
export * from "./navigation/finance-sections";
export * from "./navigation/daily-log-sections";
export * from "./navigation/nav-sections";
