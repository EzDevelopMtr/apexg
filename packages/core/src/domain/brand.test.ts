import { describe, expect, it } from "vitest";
import {
  contrastRatio,
  deriveBrandPalette,
  isAllowedBrandColor,
  isHexColor,
  MIN_TEXT_CONTRAST,
} from "./brand";
import type { HexColor } from "./brand";

const hex = (value: string) => {
  if (!isHexColor(value)) throw new Error(`not a hex colour: ${value}`);
  return value;
};
const CANVAS = hex("#0f1215");

describe("isHexColor", () => {
  it("accepts lowercase #rrggbb only", () => {
    expect(isHexColor("#306e9d")).toBe(true);
    expect(isHexColor("#306E9D")).toBe(false);
    expect(isHexColor("306e9d")).toBe(false);
    expect(isHexColor("#36e")).toBe(false);
  });
});

describe("isAllowedBrandColor", () => {
  it.each([
    ["APEX blue", "#306e9d"],
    ["violet", "#7c3aed"],
    ["teal", "#0e9aa7"],
    ["magenta", "#c026d3"],
    ["grey", "#6b7280"],
  ])("accepts %s", (_, color) => {
    expect(isAllowedBrandColor(hex(color))).toBe(true);
  });

  // Status hues (CLAUDE.md → Colour): a brand there would read as a state.
  it.each([
    ["red", "#dc2626"],
    ["orange", "#f97316"],
    ["amber", "#f59e0b"],
    ["green", "#22c55e"],
    ["lime", "#84cc16"],
  ])("rejects %s", (_, color) => {
    expect(isAllowedBrandColor(hex(color))).toBe(false);
  });
});

describe("deriveBrandPalette", () => {
  const samples: HexColor[] = ["#306e9d", "#1e1b4b", "#a5f3fc", "#7c3aed", "#6b7280"].map(hex);

  it.each(samples)("keeps the chosen colour as the fill (%s)", (color) => {
    expect(deriveBrandPalette(color)["--color-brand"]).toBe(color);
  });

  it.each(samples)("brand-ink stays readable on the canvas (%s)", (color) => {
    const ink = deriveBrandPalette(color)["--color-brand-ink"];
    expect(contrastRatio(ink, CANVAS)).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
  });

  it.each(samples)("text on the fill is readable (%s)", (color) => {
    const palette = deriveBrandPalette(color);
    expect(
      contrastRatio(palette["--color-brand-contrast"], color),
    ).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
  });

  it("puts dark text on a pale brand and white on a deep one", () => {
    expect(deriveBrandPalette(hex("#a5f3fc"))["--color-brand-contrast"]).toBe("#0f1215");
    expect(deriveBrandPalette(hex("#1e1b4b"))["--color-brand-contrast"]).toBe("#ffffff");
  });
});
