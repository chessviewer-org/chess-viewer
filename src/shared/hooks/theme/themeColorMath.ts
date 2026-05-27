/**
 * Calculates the WCAG contrast ratio between two hex colors.
 *
 * @param color1 - First hex color
 * @param color2 - Second hex color
 * @returns Contrast ratio formatted to two decimal places (e.g. `"4.54"`)
 */
export function getContrastRatio(color1: string, color2: string): string {
  const getLuminance = (hex: string) => {
    const rgb = parseInt(hex.slice(1), 16);
    const r = ((rgb >> 16) & 0xff) / 255;
    const g = ((rgb >> 8) & 0xff) / 255;
    const b = (rgb & 0xff) / 255;

    const transformed = [r, g, b].map((c) =>
      c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    );

    const rs = transformed[0] ?? 0;
    const gs = transformed[1] ?? 0;
    const bs = transformed[2] ?? 0;

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  return ratio.toFixed(2);
}

/**
 * Generates the complementary (inverted) color of a hex value.
 *
 * @param hex - Source hex color
 * @returns Complementary hex color
 */
export function generateComplementary(hex: string): string {
  const num = parseInt(hex.slice(1), 16);
  const r = 255 - ((num >> 16) & 0xff);
  const g = 255 - ((num >> 8) & 0xff);
  const b = 255 - (num & 0xff);
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/**
 * Lightens or darkens a hex color by the given percentage.
 *
 * @param hex - Source hex color
 * @param percent - Positive to lighten, negative to darken (e.g. `10` or `-20`)
 * @returns Adjusted hex color, clamped to the 0–255 channel range
 */
export function adjustBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.slice(1), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + amt));
  const G = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amt));
  const B = Math.min(255, Math.max(0, (num & 0xff) + amt));
  return '#' + ((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1);
}
