/**
 * A gym's brand colour, and the five tokens of `theme.css` it becomes.
 *
 * Each gym picks ONE colour. Everything else is derived here so that a
 * careless pick cannot produce unreadable text: the derived values are pushed
 * until they clear the contrast `theme.css` documents.
 */

/** `#rrggbb`, lowercase. */
export type HexColor = string & { readonly __brand: "HexColor" };

/** The brand family of `theme.css`, as CSS custom properties. */
export interface BrandPalette {
  readonly "--color-brand": HexColor;
  readonly "--color-brand-strong": HexColor;
  readonly "--color-brand-ink": HexColor;
  readonly "--color-brand-soft": HexColor;
  readonly "--color-brand-contrast": HexColor;
}

/** `--color-canvas`: the surface brand text sits on. */
const CANVAS = "#0f1215" as HexColor;
const WHITE = "#ffffff" as HexColor;
/** `--color-ink-on-light`, for fills too bright to carry white. */
const DARK_INK = "#0f1215" as HexColor;

/** WCAG AA for body text; `brand-ink` is held to it against the canvas. */
export const MIN_TEXT_CONTRAST = 4.5;

/**
 * Hues (degrees) a brand may take. Red, amber and green belong to the
 * client states (SRS §4.2, `CLAUDE.md` → Colour); a brand in them would stop
 * "Activo" or "En mora" reading as a signal. What is left is the cool half.
 */
export const BRAND_HUE_RANGE = { from: 170, to: 330 } as const;

/** Below this saturation a colour reads as grey: no hue to clash with. */
const GREY_SATURATION = 0.12;

const HEX_PATTERN = /^#[0-9a-f]{6}$/;

export function isHexColor(value: string): value is HexColor {
  return HEX_PATTERN.test(value);
}

interface Hsl {
  h: number;
  s: number;
  l: number;
}

function toRgb(hex: HexColor): [number, number, number] {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number];
}

function toHsl(hex: HexColor): Hsl {
  const [r, g, b] = toRgb(hex);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: (h * 60 + 360) % 360, s, l };
}

function fromHsl({ h, s, l }: Hsl): HexColor {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const sector = Math.floor(h / 60) % 6;
  const sectors: readonly (readonly [number, number, number])[] = [
    [c, x, 0],
    [x, c, 0],
    [0, c, x],
    [0, x, c],
    [x, 0, c],
    [c, 0, x],
  ];
  const [r, g, b] = sectors[sector] ?? [0, 0, 0];
  const channel = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${channel(r)}${channel(g)}${channel(b)}` as HexColor;
}

function luminance(hex: HexColor): number {
  const linear = toRgb(hex).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  const [r = 0, g = 0, b = 0] = linear;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio, 1–21. */
export function contrastRatio(a: HexColor, b: HexColor): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** Whether `color` may be a gym's brand: a grey, or a hue in the cool half. */
export function isAllowedBrandColor(color: HexColor): boolean {
  const { h, s } = toHsl(color);
  return s < GREY_SATURATION || (h >= BRAND_HUE_RANGE.from && h <= BRAND_HUE_RANGE.to);
}

/** Raises lightness until the colour clears `ratio` against the canvas. */
function readableOnCanvas(base: Hsl, ratio: number): HexColor {
  let candidate = { ...base, l: Math.max(base.l, 0.6) };
  while (contrastRatio(fromHsl(candidate), CANVAS) < ratio && candidate.l < 0.97) {
    candidate = { ...candidate, l: candidate.l + 0.02 };
  }
  return fromHsl(candidate);
}

/** The five brand tokens for a gym whose colour is `brand`. */
export function deriveBrandPalette(brand: HexColor): BrandPalette {
  const hsl = toHsl(brand);
  const contrast = contrastRatio(brand, WHITE) >= MIN_TEXT_CONTRAST ? WHITE : DARK_INK;
  return {
    "--color-brand": brand,
    "--color-brand-strong": fromHsl({ ...hsl, l: Math.min(hsl.l + 0.08, 0.95) }),
    "--color-brand-ink": readableOnCanvas(hsl, MIN_TEXT_CONTRAST + 1.5),
    "--color-brand-soft": fromHsl({ ...hsl, s: hsl.s * 0.55, l: 0.2 }),
    "--color-brand-contrast": contrast,
  };
}
