import { describe, expect, it } from "vitest";
import type { RgbaImage } from "./logo-background";
import { cleanLogoBackground } from "./logo-background";

type Rgba = readonly [number, number, number, number];

function image(width: number, height: number, paint: (x: number, y: number) => Rgba): RgbaImage {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) data.set(paint(x, y), (y * width + x) * 4);
  return { data, width, height };
}

const pixel = ({ data, width }: RgbaImage, x: number, y: number) => [...data.subarray((y * width + x) * 4, (y * width + x) * 4 + 4)];

const WHITE: Rgba = [255, 255, 255, 255];
const BLACK: Rgba = [0, 0, 0, 255];
/** The fake transparency of image sites: 2-px squares of #ededed and white. */
const checker = (x: number, y: number): Rgba => ((x >> 1) + (y >> 1)) % 2 ? [237, 237, 237, 255] : WHITE;
const inside = (x: number, y: number, from: number, to: number) => x >= from && x <= to && y >= from && y <= to;

describe("cleanLogoBackground", () => {
  it("clears a painted checkerboard and crops to the drawing, keeping the white it encloses", () => {
    const logo = image(12, 12, (x, y) => (x === 5 && y === 5 ? WHITE : inside(x, y, 4, 7) ? BLACK : checker(x, y)));
    const result = cleanLogoBackground(logo);
    if (result.kind !== "cleared") throw new Error(`expected cleared, got ${result.kind}`);
    expect([result.image.width, result.image.height]).toEqual([4, 4]);
    expect(pixel(result.image, 1, 1)).toEqual([...WHITE]);
    expect(pixel(result.image, 0, 0)).toEqual([...BLACK]);
  });

  it("takes the white out of an anti-aliased edge instead of leaving a light halo", () => {
    const logo = image(10, 10, (x, y) => (x === 2 && y === 4 ? [128, 128, 128, 255] : inside(x, y, 3, 6) ? BLACK : WHITE));
    const result = cleanLogoBackground(logo);
    if (result.kind !== "cleared") throw new Error(`expected cleared, got ${result.kind}`);
    expect(pixel(result.image, 0, 1)).toEqual([0, 0, 0, 127]);
  });

  it("leaves alone a logo that already has transparency", () => {
    const logo = image(8, 8, (x, y) => (inside(x, y, 2, 5) ? BLACK : [255, 255, 255, 0]));
    expect(cleanLogoBackground(logo).kind).toBe("transparent");
  });

  it("calls a dark background opaque: no rule tells it from the drawing", () => {
    const logo = image(8, 8, (x, y) => (inside(x, y, 2, 5) ? WHITE : [30, 30, 30, 255]));
    expect(cleanLogoBackground(logo).kind).toBe("opaque");
  });

  it("never clears a pale colour, which may be the brand", () => {
    const logo = image(8, 8, (x, y) => (inside(x, y, 2, 5) ? BLACK : [255, 215, 215, 255]));
    expect(cleanLogoBackground(logo).kind).toBe("opaque");
  });

  it("calls a blank image opaque rather than clearing all of it", () => {
    expect(cleanLogoBackground(image(8, 8, () => WHITE)).kind).toBe("opaque");
  });
});
