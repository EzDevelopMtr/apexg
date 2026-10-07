/*
  A logo taken from the internet often fakes its transparency: the grey and
  white checkerboard is painted into the pixels, or the background is plain
  white. This finds that background — light, grey, and reaching the edge of
  the image — and clears it, leaving untouched any white the drawing encloses
  (a highlight, an eye). It works on RGBA rows, the shape of a canvas's
  ImageData, so it runs in a plain Node test as well as in the browser.
*/

export interface RgbaImage {
  /** Four bytes per pixel — red, green, blue, alpha — row after row. */
  readonly data: Uint8ClampedArray;
  readonly width: number;
  readonly height: number;
}

export type LogoCleanup =
  | { readonly kind: "transparent" }
  | { readonly kind: "opaque" }
  | { readonly kind: "cleared"; readonly image: RgbaImage };

/** Darkest channel a background pixel may have: checkerboards run from #ccc to #fff. */
const LIGHT_FLOOR = 195;
/** Widest gap between channels: greys and whites, never a pale colour. */
const GREY_SPREAD = 18;
/** Under this share there is nothing worth clearing; over the other, the "background" is the drawing. */
const MIN_SHARE = 0.05;
const MAX_SHARE = 0.98;
/** Room left around the drawing once the empty border is cropped, as a share of the longer side. */
const MARGIN = 0.02;

const at = (data: Uint8ClampedArray, index: number): number => data[index] ?? 0;

function hasTransparency({ data }: RgbaImage): boolean {
  for (let i = 3; i < data.length; i += 4) if (at(data, i) < 255) return true;
  return false;
}

function isLightGrey(data: Uint8ClampedArray, offset: number): boolean {
  const channels = [at(data, offset), at(data, offset + 1), at(data, offset + 2)];
  const darkest = Math.min(...channels);
  return darkest >= LIGHT_FLOOR && Math.max(...channels) - darkest <= GREY_SPREAD;
}

/** 1 for every light grey pixel joined to the edge of the image, 0 elsewhere. */
function edgeBackground({ data, width, height }: RgbaImage): Uint8Array {
  const mask = new Uint8Array(width * height);
  const pending: number[] = [];
  const visit = (pixel: number) => {
    if (mask[pixel] === 1 || !isLightGrey(data, pixel * 4)) return;
    mask[pixel] = 1;
    pending.push(pixel);
  };
  for (let x = 0; x < width; x++) [x, (height - 1) * width + x].forEach(visit);
  for (let y = 0; y < height; y++) [y * width, y * width + width - 1].forEach(visit);
  for (let pixel = pending.pop(); pixel !== undefined; pixel = pending.pop()) {
    const x = pixel % width;
    if (x > 0) visit(pixel - 1);
    if (x < width - 1) visit(pixel + 1);
    if (pixel >= width) visit(pixel - width);
    if (pixel < width * (height - 1)) visit(pixel + width);
  }
  return mask;
}

/**
 * An anti-aliased edge pixel is part drawing, part white: this takes the
 * white out ("colour to alpha"), so the edge does not glow on a dark page.
 */
function unblendFromWhite(data: Uint8ClampedArray, offset: number): void {
  const alpha = Math.max(255 - at(data, offset), 255 - at(data, offset + 1), 255 - at(data, offset + 2)) / 255;
  for (let c = 0; c < 3 && alpha > 0; c++) data[offset + c] = 255 - (255 - at(data, offset + c)) / alpha;
  data[offset + 3] = Math.round(alpha * 255);
}

function clearBackground(image: RgbaImage, mask: Uint8Array): Uint8ClampedArray {
  const { width } = image;
  const data = new Uint8ClampedArray(image.data);
  const touchesBackground = (pixel: number) => {
    const x = pixel % width;
    return (x > 0 && mask[pixel - 1] === 1) || (x < width - 1 && mask[pixel + 1] === 1) ||
      mask[pixel - width] === 1 || mask[pixel + width] === 1;
  };
  for (let pixel = 0; pixel < mask.length; pixel++) {
    if (mask[pixel] === 1) data[pixel * 4 + 3] = 0;
    else if (touchesBackground(pixel)) unblendFromWhite(data, pixel * 4);
  }
  return data;
}

/** The box around every visible pixel, plus a thin margin: an empty border only shrinks a logo on screen. */
function cropToContent(image: RgbaImage): RgbaImage {
  const { data, width, height } = image;
  let [top, left, bottom, right] = [height, width, -1, -1];
  for (let pixel = 0; pixel < width * height; pixel++) {
    if (at(data, pixel * 4 + 3) === 0) continue;
    const [x, y] = [pixel % width, Math.floor(pixel / width)];
    [top, bottom, left, right] = [Math.min(top, y), Math.max(bottom, y), Math.min(left, x), Math.max(right, x)];
  }
  if (bottom < 0) return image;
  const margin = Math.round(Math.max(width, height) * MARGIN);
  const [x0, y0] = [Math.max(0, left - margin), Math.max(0, top - margin)];
  const w = Math.min(width - 1, right + margin) - x0 + 1;
  const h = Math.min(height - 1, bottom + margin) - y0 + 1;
  const cropped = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    const start = ((y0 + y) * width + x0) * 4;
    cropped.set(data.subarray(start, start + w * 4), y * w * 4);
  }
  return { data: cropped, width: w, height: h };
}

/**
 * What a logo's background needs: nothing when it is already transparent;
 * clearing (the result, cropped to the drawing) when an opaque light grey
 * background surrounds it; a warning when it is opaque some other way — a
 * dark background or a photo, which no rule can tell from the drawing.
 */
export function cleanLogoBackground(image: RgbaImage): LogoCleanup {
  if (hasTransparency(image)) return { kind: "transparent" };
  const mask = edgeBackground(image);
  const share = mask.reduce((sum, value) => sum + value, 0) / mask.length;
  if (share < MIN_SHARE || share > MAX_SHARE) return { kind: "opaque" };
  return { kind: "cleared", image: cropToContent({ ...image, data: clearBackground(image, mask) }) };
}
