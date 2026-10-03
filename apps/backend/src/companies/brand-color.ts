/**
 * Espejo de `isHexColor` / `isAllowedBrandColor` en `@apexg/core`, que es la
 * fuente: se repite porque este backend no depende de ese paquete, y la API
 * tiene que rechazar lo mismo que el panel. Rojo, ámbar y verde son de los
 * estados del cliente (CLAUDE.md → Colour): una marca ahí dejaría de leerse
 * "Activo" o "En mora" como señal.
 */

const HEX_PATTERN = /^#[0-9a-f]{6}$/;
const HUE_FROM = 170;
const HUE_TO = 330;
const GREY_SATURATION = 0.12;

function hueAndSaturation(hex: string): { h: number; s: number } {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [
    number,
    number,
    number,
  ];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) return { h: 0, s: 0 };
  const s = d / (1 - Math.abs(max + min - 1));
  const sector = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: (sector * 60 + 360) % 360, s };
}

/** `null` si sirve; si no, el motivo para quien lo eligió. */
export function brandColorProblem(value: string): string | null {
  if (!HEX_PATTERN.test(value)) {
    return 'El color debe tener el formato #rrggbb (minúsculas).';
  }
  const { h, s } = hueAndSaturation(value);
  if (s >= GREY_SATURATION && (h < HUE_FROM || h > HUE_TO)) {
    return 'Rojo, naranja, ámbar y verde están reservados para los estados del cliente: elige un azul, turquesa, violeta, magenta o gris.';
  }
  return null;
}
