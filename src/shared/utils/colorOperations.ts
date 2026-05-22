import { hexToRgb, hslToRgb, rgbToHex, rgbToHsl } from './colorConversions';

/**
 * Lightens a hex color by the given amount.
 *
 * @param {string} hex - Input hex color
 * @param {number} amount - Amount to increase lightness (0–100)
 * @returns {string} Lightened hex color
 */
export function lighten(hex, amount) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  hsl.l = Math.min(100, hsl.l + amount);
  const newRgb = hslToRgb(hsl.h, hsl.s, hsl.l);
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
}
/**
 * Darkens a hex color by the given amount.
 *
 * @param {string} hex - Input hex color
 * @param {number} amount - Amount to decrease lightness (0–100)
 * @returns {string} Darkened hex color
 */
export function darken(hex, amount) {
  return lighten(hex, -amount);
}
/**
 * Adjusts the brightness of a hex color by a percentage.
 *
 * @param {string} hex - Input hex color
 * @param {number} percent - Brightness adjustment percentage (-100 to 100)
 * @returns {string} Adjusted hex color
 */
export function adjustBrightness(hex, percent) {
  const num = parseInt(hex.slice(1), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + amt));
  const G = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amt));
  const B = Math.min(255, Math.max(0, (num & 0xff) + amt));
  return rgbToHex(R, G, B);
}
/**
 * Returns the complementary (bitwise-inverted) color.
 *
 * @param {string} hex - Input hex color
 * @returns {string} Complementary hex color
 */
export function getComplementary(hex) {
  const num = parseInt(hex.slice(1), 16);
  const r = 255 - ((num >> 16) & 0xff);
  const g = 255 - ((num >> 8) & 0xff);
  const b = 255 - (num & 0xff);
  return rgbToHex(r, g, b);
}
/**
 * Calculates the relative luminance of a hex color (WCAG formula).
 *
 * @param {string} hex - Input hex color
 * @returns {number} Luminance (0–1)
 */
export function getLuminance(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const channels = [rgb.r, rgb.g, rgb.b];
  const linear = channels.map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}
/**
 * Calculates the WCAG contrast ratio between two hex colors.
 *
 * @param {string} hex1 - First hex color
 * @param {string} hex2 - Second hex color
 * @returns {number} Contrast ratio
 */
export function getContrastRatio(hex1, hex2) {
  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return Math.round(((lighter + 0.05) / (darker + 0.05)) * 100) / 100;
}
/**
 * Checks whether two colors meet the WCAG contrast requirement.
 *
 * @param {string} hex1 - First hex color
 * @param {string} hex2 - Second hex color
 * @param {'AA'|'AAA'} [level='AA'] - WCAG conformance level
 * @returns {boolean}
 */
export function hasGoodContrast(hex1, hex2, level = 'AA') {
  const ratio = getContrastRatio(hex1, hex2);
  const minimumRatio = level === 'AAA' ? 7 : 4.5;
  return ratio >= minimumRatio;
}
/**
 * Generates a lightness-graduated palette from a base color.
 *
 * @param {string} baseColor - Base hex color
 * @param {number} [count=5] - Number of palette steps
 * @returns {string[]} Array of hex colors
 */
export function generatePalette(baseColor, count = 5) {
  const rgb = hexToRgb(baseColor);
  if (!rgb) return [baseColor];
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const palette = [];
  const step = 100 / (count + 1);
  for (let i = 1; i <= count; i++) {
    const newLightness = Math.min(95, step * i);
    const newRgb = hslToRgb(hsl.h, hsl.s, newLightness);
    palette.push(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
  }
  return palette;
}
/**
 * Returns an analogous color scheme around the given color.
 *
 * @param {string} hex - Base hex color
 * @param {number} [angle=30] - Hue offset in degrees
 * @returns {string[]} Array of three hex colors
 */
export function getAnalogous(hex, angle = 30) {
  const rgb = hexToRgb(hex);
  if (!rgb) return [hex];
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const offsets = [-angle, 0, angle];
  return offsets.map((offset) => {
    const newHue = (hsl.h + offset + 360) % 360;
    const newRgb = hslToRgb(newHue, hsl.s, hsl.l);
    return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
  });
}
/**
 * Returns a triadic color scheme from the given color.
 *
 * @param {string} hex - Base hex color
 * @returns {string[]} Array of three hex colors (120° apart)
 */
export function getTriadic(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return [hex];
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const offsets = [0, 120, 240];
  return offsets.map((offset) => {
    const newHue = (hsl.h + offset) % 360;
    const newRgb = hslToRgb(newHue, hsl.s, hsl.l);
    return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
  });
}
/**
 * @returns {string} A random valid hex color
 */
export function randomColor() {
  let hexString = Math.floor(Math.random() * 16777215).toString(16);
  while (hexString.length < 6) hexString = '0' + hexString;
  return '#' + hexString;
}
/**
 * @param {string} hex - Hex color string
 * @returns {boolean} True if the string is a valid 6-digit hex color
 */
export function isValidHex(hex) {
  return /^#[0-9A-Fa-f]{6}$/.test(hex);
}
/**
 * Normalizes a hex color string to uppercase 6-digit format.
 * Returns '#000000' for invalid input.
 *
 * @param {string} color - Raw color string
 * @returns {string} Normalized hex color
 */
export function normalizeHex(color) {
  if (!color) return '#000000';
  let hex = color.trim();
  if (hex.charAt(0) !== '#') hex = '#' + hex;
  if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return '#000000';
  return hex.toUpperCase();
}
/**
 * Mixes two hex colors at the given ratio.
 *
 * @param {string} hex1 - First hex color
 * @param {string} hex2 - Second hex color
 * @param {number} [ratio=0.5] - Mix ratio (0 = hex1, 1 = hex2)
 * @returns {string} Mixed hex color
 */
export function mixColors(hex1, hex2, ratio = 0.5) {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return hex1;
  const r = Math.round(rgb1.r * (1 - ratio) + rgb2.r * ratio);
  const g = Math.round(rgb1.g * (1 - ratio) + rgb2.g * ratio);
  const b = Math.round(rgb1.b * (1 - ratio) + rgb2.b * ratio);
  return rgbToHex(r, g, b);
}
/**
 * Returns a human-readable color name for a hex color.
 *
 * @param {string} hex - Hex color
 * @returns {string} Color name (e.g. 'Blue', 'Red', 'Gray')
 */
export function getColorName(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return 'Unknown';
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  if (hsl.l < 10) return 'Black';
  if (hsl.l > 90) return 'White';
  if (hsl.s < 10) return 'Gray';
  const hue = hsl.h;
  if (hue < 15 || hue >= 345) return 'Red';
  if (hue < 45) return 'Orange';
  if (hue < 75) return 'Yellow';
  if (hue < 165) return 'Green';
  if (hue < 195) return 'Cyan';
  if (hue < 255) return 'Blue';
  if (hue < 285) return 'Purple';
  return 'Pink';
}
