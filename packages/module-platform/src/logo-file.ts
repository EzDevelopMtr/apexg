import { cleanLogoBackground, logoProblem } from "@apexg/core";
import type { RgbaImage } from "@apexg/core";

/** The sign-in page shows a logo at most 320 × 112: 640 covers a 2× screen. */
const MAX_SIDE = 640;

export type PreparedLogo =
  | { readonly kind: "as-is"; readonly file: File }
  /** Kept as it came, with its background: worth a warning. */
  | { readonly kind: "opaque"; readonly file: File }
  /** Its painted background removed, as a new PNG. */
  | { readonly kind: "cleared"; readonly file: File };

function canvasOf(width: number, height: number): CanvasRenderingContext2D {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Sin canvas");
  return context;
}

async function readPixels(file: File): Promise<RgbaImage> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const [width, height] = [Math.max(1, Math.round(bitmap.width * scale)), Math.max(1, Math.round(bitmap.height * scale))];
  const context = canvasOf(width, height);
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return { data: context.getImageData(0, 0, width, height).data, width, height };
}

async function toPng({ data, width, height }: RgbaImage, name: string): Promise<File> {
  const context = canvasOf(width, height);
  context.putImageData(new ImageData(new Uint8ClampedArray(data), width, height), 0, 0);
  const blob = await new Promise<Blob | null>((resolve) => context.canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("Sin PNG");
  return new File([blob], `${name.replace(/\.[^.]+$/, "")}.png`, { type: "image/png" });
}

/**
 * Looks at a raster logo before it goes up, so the preview shows exactly what
 * will be saved. An SVG goes as it is: it is drawn, not painted on a background.
 */
export async function prepareLogo(file: File): Promise<PreparedLogo> {
  if (file.type === "image/svg+xml") return { kind: "as-is", file };
  try {
    const result = cleanLogoBackground(await readPixels(file));
    if (result.kind === "transparent") return { kind: "as-is", file };
    if (result.kind === "opaque") return { kind: "opaque", file };
    const cleared = await toPng(result.image, file.name);
    return logoProblem(cleared) ? { kind: "opaque", file } : { kind: "cleared", file: cleared };
  } catch {
    // Unreadable here: it goes as it is, and the server still checks it.
    return { kind: "as-is", file };
  }
}
