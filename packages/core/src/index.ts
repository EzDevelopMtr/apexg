/**
 * `@apexg/core` — the domain.
 *
 * No React, no Next, no data access. Everything here runs in a plain Node test,
 * which is what makes the financial rules in SRS §4 verifiable (RNF-07).
 */

export * from "./domain/money";
export * from "./domain/calendar";
export * from "./domain/client";
export * from "./domain/membership";
export * from "./domain/membership-catalog";

export * from "./navigation/icons";
export * from "./navigation/modules";
export * from "./navigation/client-sections";
