export type ThemeId = "dark" | "light";

/** Cookie holding the chosen theme, for the whole browser. */
export const THEME_COOKIE = "apexg-theme";

export function isThemeId(value: unknown): value is ThemeId {
  return value === "dark" || value === "light";
}
