/**
 * Converts a hex color string to an RGB object.
 *
 * @param hex - Hex color string (e.g. `#ff0000`)
 * @returns RGB components; defaults to `{r:0,g:0,b:0}` on invalid input
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { r: 0, g: 0, b: 0 };
  
  const r = result[1];
  const g = result[2];
  const b = result[3];
  
  if (r === undefined || g === undefined || b === undefined) return { r: 0, g: 0, b: 0 };

  return {
    r: parseInt(r, 16),
    g: parseInt(g, 16),
    b: parseInt(b, 16)
  };
}

/**
 * Converts RGB components to a hex color string.
 *
 * @param r - Red channel (0–255)
 * @param g - Green channel (0–255)
 * @param b - Blue channel (0–255)
 * @returns Lowercase hex string (e.g. `#ff0000`)
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
  );
}

/**
 * Converts RGB components to HSV values.
 *
 * @param r - Red channel (0–255)
 * @param g - Green channel (0–255)
 * @param b - Blue channel (0–255)
 * @returns Hue (0–1), Saturation (0–1), Value (0–1)
 */
export function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (max === min) {
    h = 0;
  } else {
    switch (max) {
      case rNorm:
        h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0);
        break;
      case gNorm:
        h = (bNorm - rNorm) / d + 2;
        break;
      case bNorm:
        h = (rNorm - gNorm) / d + 4;
        break;
      default:
        h = 0;
    }
    h /= 6;
  }

  return { h, s, v };
}

/**
 * Converts HSV values to RGB components.
 *
 * @param h - Hue (0–1)
 * @param s - Saturation (0–1)
 * @param v - Value/brightness (0–1)
 * @returns RGB components in the 0–255 range
 */
export function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  let r = 0, g = 0, b = 0;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0:
      r = v; g = t; b = p;
      break;
    case 1:
      r = q; g = v; b = p;
      break;
    case 2:
      r = p; g = v; b = t;
      break;
    case 3:
      r = p; g = q; b = v;
      break;
    case 4:
      r = t; g = p; b = v;
      break;
    case 5:
      r = v; g = p; b = q;
      break;
    default:
      r = 0; g = 0; b = 0;
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}
