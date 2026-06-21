/**
 * Color vision deficiency (CVD) simulation filter helpers.
 *
 * Applies an SVG-based CSS filter to the document root that simulates how
 * users with color vision deficiencies perceive the UI.  The three common
 * types are supported (Deuteranopia, Protanopia, Tritanopia) plus a "none"
 * value that removes any active filter.
 *
 * Implementation uses SVG `feColorMatrix` matrices based on the Brettel /
 * Viénot / Mollon (1997) model, which is the industry standard for real-time
 * CVD simulation.
 *
 * The filter is injected into a `<defs>` block inside a visually-hidden
 * `<svg>` in the document body, then referenced via `filter: url(#cv-cvd-*)`.
 */

import { safeJSONParse } from './validation';

/** The four color-vision preference values. */
export type ColorVisionPreference =
  | 'none'
  | 'deuteranopia'
  | 'protanopia'
  | 'tritanopia';

/** Effective default: no simulation active. */
const DEFAULT_COLOR_VISION: ColorVisionPreference = 'none';

/** localStorage key (synced-key convention). */
export const COLOR_VISION_STORAGE_KEY = 'cv_color_vision';

/** In-app event so a live change reaches App immediately. */
export const COLOR_VISION_CHANGE_EVENT = 'cv-color-vision-change';

/** Type guard. */
export function isColorVisionPreference(
  value: unknown
): value is ColorVisionPreference {
  return (
    value === 'none' ||
    value === 'deuteranopia' ||
    value === 'protanopia' ||
    value === 'tritanopia'
  );
}

/** Reads the persisted preference, or the default when none/invalid. */
export function readColorVisionPreference(): ColorVisionPreference {
  try {
    const raw = window.localStorage.getItem(COLOR_VISION_STORAGE_KEY);
    if (raw) {
      const parsed = safeJSONParse<ColorVisionPreference | null>(raw, null);
      if (isColorVisionPreference(parsed)) return parsed;
      if (isColorVisionPreference(raw)) return raw;
    }
  } catch {
    // localStorage blocked — fall through.
  }
  return DEFAULT_COLOR_VISION;
}

const SVG_NS = 'http://www.w3.org/2000/svg';
const DEFS_ID = 'cv-cvd-defs';

/**
 * feColorMatrix values for each CVD type.
 * Rows: R, G, B, A, bias (last column is always 0 0 0 0 1 for the A row).
 * Columns: sourceR, sourceG, sourceB, sourceA.
 */
const CVD_MATRICES: Record<Exclude<ColorVisionPreference, 'none'>, string> = {
  // Deuteranopia (green-blind): Brettel 1997
  deuteranopia: [
    '0.29901 0.58699 0.11400 0',
    '0.29901 0.58699 0.11400 0',
    '0.00000 0.19333 0.80667 0',
    '0 0 0 1 0'
  ].join(' '),

  // Protanopia (red-blind): Brettel 1997
  protanopia: [
    '0.10889 0.89111 0.00000 0',
    '0.10889 0.89111 0.00000 0',
    '0.00000 0.25238 0.74762 0',
    '0 0 0 1 0'
  ].join(' '),

  // Tritanopia (blue-blind): Brettel 1997
  tritanopia: [
    '0.96720 0.03280 0.00000 0',
    '0.02138 0.97862 0.00000 0',
    '0.02138 0.52552 0.45310 0',
    '0 0 0 1 0'
  ].join(' ')
};

/** Returns (creating if needed) the hidden SVG element that holds CVD defs. */
function ensureSvgDefs(): SVGDefsElement {
  const defsEl = document.getElementById(DEFS_ID);
  if (defsEl) return defsEl as unknown as SVGDefsElement;

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.cssText =
    'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';

  const defs = document.createElementNS(SVG_NS, 'defs');
  defs.id = DEFS_ID;
  svg.appendChild(defs);
  document.body.prepend(svg);
  return defs;
}

/** Ensures a `<filter id="cv-cvd-{type}">` exists inside the defs element. */
function ensureCvdFilter(
  defs: SVGDefsElement,
  type: Exclude<ColorVisionPreference, 'none'>
): void {
  const filterId = `cv-cvd-${type}`;
  if (document.getElementById(filterId)) return;

  const filter = document.createElementNS(SVG_NS, 'filter');
  filter.id = filterId;

  const matrix = document.createElementNS(SVG_NS, 'feColorMatrix');
  matrix.setAttribute('type', 'matrix');
  matrix.setAttribute('values', CVD_MATRICES[type]);
  filter.appendChild(matrix);
  defs.appendChild(filter);
}

/** Applies (or removes) the CVD simulation filter on the document root. */
export function applyColorVision(preference: ColorVisionPreference): void {
  const root = document.documentElement;

  if (preference === 'none') {
    root.style.removeProperty('filter');
    return;
  }

  const defs = ensureSvgDefs();
  ensureCvdFilter(defs, preference);
  root.style.filter = `url(#cv-cvd-${preference})`;
}
